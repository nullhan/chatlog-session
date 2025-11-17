/**
 * 聊天记录 API
 * 对应后端 /api/v1/chatlog 相关接口
 */

import { request } from '@/utils/request'
import type { Message } from '@/types/message'
import type { ChatlogParams, SearchParams, PaginatedResponse } from '@/types/api'

/**
 * 聊天记录 API 类
 */
class ChatlogAPI {
  /**
   * 获取聊天记录
   * GET /api/v1/chatlog
   * 
   * @param params 查询参数
   * @returns 消息列表
   */
  getChatlog(params?: ChatlogParams): Promise<Message[]> {
    return request.get<Message[]>('/api/v1/chatlog', params)
  }

  /**
   * 搜索消息
   * GET /api/v1/chatlog/search
   * 
   * @param params 搜索参数
   * @returns 搜索结果
   */
  searchMessages(params: SearchParams): Promise<PaginatedResponse<Message>> {
    return request.get<PaginatedResponse<Message>>('/api/v1/chatlog/search', params)
  }

  /**
   * 导出聊天记录（JSON 格式）
   * GET /api/v1/chatlog?format=json
   * 
   * @param params 查询参数
   * @returns JSON 格式的聊天记录
   */
  exportJSON(params?: ChatlogParams): Promise<Message[]> {
    return request.get<Message[]>('/api/v1/chatlog', {
      ...params,
      format: 'json',
    })
  }

  /**
   * 导出聊天记录（CSV 格式）
   * GET /api/v1/chatlog?format=csv
   * 
   * @param params 查询参数
   * @param filename 保存的文件名
   */
  exportCSV(params?: ChatlogParams, filename = 'chatlog.csv'): Promise<void> {
    const queryParams = new URLSearchParams({
      ...params,
      format: 'csv',
    } as any)
    return request.download(`/api/v1/chatlog?${queryParams.toString()}`, filename)
  }

  /**
   * 导出聊天记录（纯文本格式）
   * GET /api/v1/chatlog?format=text
   * 
   * @param params 查询参数
   * @param filename 保存的文件名
   */
  exportText(params?: ChatlogParams, filename = 'chatlog.txt'): Promise<void> {
    const queryParams = new URLSearchParams({
      ...params,
      format: 'text',
    } as any)
    return request.download(`/api/v1/chatlog?${queryParams.toString()}`, filename)
  }

  /**
   * 获取指定会话的消息
   * 
   * @param talker 会话 ID（talker）
   * @param limit 返回数量
   * @param offset 偏移量
   * @returns 消息列表
   */
  getSessionMessages(talker: string, limit = 50, offset = 0): Promise<Message[]> {
    return this.getChatlog({
      talker,
      limit,
      offset,
    })
  }

  /**
   * 获取指定时间段的消息
   * 
   * @param time 时间戳或时间范围（格式：timestamp 或 start-end）
   * @param talker 会话 ID（可选）
   * @param limit 返回数量
   * @returns 消息列表
   */
  getMessagesByTime(time: string, talker?: string, limit = 50): Promise<Message[]> {
    return this.getChatlog({
      time,
      talker,
      limit,
    })
  }

  /**
   * 获取指定发送者的消息
   * 
   * @param sender 发送者 ID
   * @param talker 会话 ID（可选）
   * @param limit 返回数量
   * @returns 消息列表
   */
  getMessagesBySender(sender: string, talker?: string, limit = 50): Promise<Message[]> {
    return this.getChatlog({
      sender,
      talker,
      limit,
    })
  }

  /**
   * 搜索指定会话内的消息
   * 
   * @param keyword 搜索关键词
   * @param talker 会话 ID
   * @param limit 返回数量
   * @returns 搜索结果
   */
  searchInSession(keyword: string, talker: string, limit = 50): Promise<PaginatedResponse<Message>> {
    return this.searchMessages({
      keyword,
      talker,
      limit,
    })
  }

  /**
   * 全局搜索消息
   * 
   * @param keyword 搜索关键词
   * @param type 消息类型（可选）
   * @param limit 返回数量
   * @returns 搜索结果
   */
  globalSearch(keyword: string, type?: number, limit = 50): Promise<PaginatedResponse<Message>> {
    return this.searchMessages({
      keyword,
      type,
      limit,
    })
  }

  /**
   * 按消息类型搜索
   * 
   * @param type 消息类型
   * @param talker 会话 ID（可选）
   * @param limit 返回数量
   * @returns 搜索结果
   */
  searchByType(type: number, talker?: string, limit = 50): Promise<PaginatedResponse<Message>> {
    return this.searchMessages({
      keyword: '',
      type,
      talker,
      limit,
    })
  }
}

/**
 * 导出单例
 */
export const chatlogAPI = new ChatlogAPI()

/**
 * 默认导出
 */
export default chatlogAPI