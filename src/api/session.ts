/**
 * 会话管理 API
 * 对应后端 /api/v1/session 相关接口
 */

import { request } from '@/utils/request'
import type { Session } from '@/types/session'
import type { SessionParams } from '@/types/api'

/**
 * 会话 API 类
 */
class SessionAPI {
  /**
   * 获取会话列表
   * GET /api/v1/session
   * 
   * @param params 查询参数
   * @returns 会话列表
   */
  getSessions(params?: SessionParams): Promise<Session[]> {
    return request.get<Session[]>('/api/v1/session', params)
  }

  /**
   * 获取会话详情
   * GET /api/v1/session/:talker
   * 
   * @param talker 会话 ID
   * @returns 会话详情
   */
  getSessionDetail(talker: string): Promise<Session> {
    return request.get<Session>(`/api/v1/session/${encodeURIComponent(talker)}`)
  }

  /**
   * 获取所有会话（分页）
   * 
   * @param limit 返回数量
   * @param offset 偏移量
   * @returns 会话列表
   */
  getAllSessions(limit = 50, offset = 0): Promise<Session[]> {
    return this.getSessions({ limit, offset })
  }

  /**
   * 按类型获取会话
   * 
   * @param type 会话类型（private: 私聊, group: 群聊）
   * @param limit 返回数量
   * @returns 会话列表
   */
  getSessionsByType(type: 'private' | 'group', limit = 50): Promise<Session[]> {
    return this.getSessions({ type, limit })
  }

  /**
   * 获取私聊会话列表
   * 
   * @param limit 返回数量
   * @returns 私聊会话列表
   */
  getPrivateSessions(limit = 50): Promise<Session[]> {
    return this.getSessionsByType('private', limit)
  }

  /**
   * 获取群聊会话列表
   * 
   * @param limit 返回数量
   * @returns 群聊会话列表
   */
  getGroupSessions(limit = 50): Promise<Session[]> {
    return this.getSessionsByType('group', limit)
  }

  /**
   * 获取置顶会话
   * 
   * @returns 置顶会话列表
   */
  async getPinnedSessions(): Promise<Session[]> {
    const sessions = await this.getSessions()
    return sessions.filter(session => session.isPinned)
  }

  /**
   * 获取活跃会话
   * （根据最后消息时间排序）
   * 
   * @param limit 返回数量
   * @returns 活跃会话列表
   */
  async getActiveSessions(limit = 20): Promise<Session[]> {
    const sessions = await this.getSessions({ limit })
    return sessions.sort((a, b) => {
      const timeA = a.lastMessage?.createTime || 0
      const timeB = b.lastMessage?.createTime || 0
      return timeB - timeA
    })
  }

  /**
   * 搜索会话
   * 
   * @param keyword 搜索关键词（会话名称或备注）
   * @returns 搜索结果
   */
  async searchSessions(keyword: string): Promise<Session[]> {
    const sessions = await this.getSessions()
    const lowerKeyword = keyword.toLowerCase()
    
    return sessions.filter(session => {
      const name = (session.name || '').toLowerCase()
      const remark = (session.remark || '').toLowerCase()
      return name.includes(lowerKeyword) || remark.includes(lowerKeyword)
    })
  }

  /**
   * 获取未读会话
   * 
   * @returns 有未读消息的会话列表
   */
  async getUnreadSessions(): Promise<Session[]> {
    const sessions = await this.getSessions()
    return sessions.filter(session => (session.unreadCount || 0) > 0)
  }

  /**
   * 获取会话统计信息
   * 
   * @returns 统计信息
   */
  async getSessionStats(): Promise<{
    total: number
    private: number
    group: number
    unread: number
    pinned: number
  }> {
    const sessions = await this.getSessions()
    
    return {
      total: sessions.length,
      private: sessions.filter(s => s.type === 'private').length,
      group: sessions.filter(s => s.type === 'group').length,
      unread: sessions.filter(s => (s.unreadCount || 0) > 0).length,
      pinned: sessions.filter(s => s.isPinned).length,
    }
  }

  /**
   * 批量获取会话详情
   * 
   * @param talkers 会话 ID 列表
   * @returns 会话详情列表
   */
  async getBatchSessionDetails(talkers: string[]): Promise<Session[]> {
    const promises = talkers.map(talker => this.getSessionDetail(talker))
    return request.all<Session>(promises)
  }
}

/**
 * 导出单例
 */
export const sessionAPI = new SessionAPI()

/**
 * 默认导出
 */
export default sessionAPI