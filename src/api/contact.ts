/**
 * 联系人管理 API
 * 对应后端 /api/v1/contact 相关接口
 */

import { request } from '@/utils/request'
import type { Contact } from '@/types/contact'
import type { ContactParams } from '@/types/api'

/**
 * 联系人 API 类
 */
class ContactAPI {
  /**
   * 获取联系人列表
   * GET /api/v1/contact
   * 
   * @param params 查询参数
   * @returns 联系人列表
   */
  getContacts(params?: ContactParams): Promise<Contact[]> {
    return request.get<Contact[]>('/api/v1/contact', params)
  }

  /**
   * 获取联系人详情
   * GET /api/v1/contact/:wxid
   * 
   * @param wxid 联系人微信 ID
   * @returns 联系人详情
   */
  getContactDetail(wxid: string): Promise<Contact> {
    return request.get<Contact>(`/api/v1/contact/${encodeURIComponent(wxid)}`)
  }

  /**
   * 获取群聊列表
   * GET /api/v1/contact?type=chatroom
   * 
   * @param limit 返回数量
   * @returns 群聊列表
   */
  getChatrooms(limit = 100): Promise<Contact[]> {
    return this.getContacts({ type: 'chatroom', limit })
  }

  /**
   * 获取好友列表
   * GET /api/v1/contact?type=friend
   * 
   * @param limit 返回数量
   * @returns 好友列表
   */
  getFriends(limit = 100): Promise<Contact[]> {
    return this.getContacts({ type: 'friend', limit })
  }

  /**
   * 获取公众号列表
   * GET /api/v1/contact?type=official
   * 
   * @param limit 返回数量
   * @returns 公众号列表
   */
  getOfficialAccounts(limit = 100): Promise<Contact[]> {
    return this.getContacts({ type: 'official', limit })
  }

  /**
   * 搜索联系人
   * GET /api/v1/contact?keyword=xxx
   * 
   * @param keyword 搜索关键词
   * @param type 联系人类型（可选）
   * @returns 搜索结果
   */
  searchContacts(keyword: string, type?: string): Promise<Contact[]> {
    return this.getContacts({ keyword, type })
  }

  /**
   * 获取所有联系人（不分类型）
   * 
   * @param limit 返回数量
   * @returns 所有联系人
   */
  getAllContacts(limit = 1000): Promise<Contact[]> {
    return this.getContacts({ limit })
  }

  /**
   * 按首字母分组获取联系人
   * 
   * @returns 按首字母分组的联系人
   */
  async getContactsByLetter(): Promise<Record<string, Contact[]>> {
    const contacts = await this.getFriends()
    const grouped: Record<string, Contact[]> = {}

    contacts.forEach(contact => {
      // 获取首字母（简单处理，实际可能需要更复杂的拼音转换）
      const letter = this.getFirstLetter(contact.nickname || contact.alias || contact.wxid)
      if (!grouped[letter]) {
        grouped[letter] = []
      }
      grouped[letter].push(contact)
    })

    // 排序每组内的联系人
    Object.keys(grouped).forEach(letter => {
      grouped[letter].sort((a, b) => {
        const nameA = a.remark || a.nickname || a.alias || a.wxid
        const nameB = b.remark || b.nickname || b.alias || b.wxid
        return nameA.localeCompare(nameB, 'zh-CN')
      })
    })

    return grouped
  }

  /**
   * 获取星标联系人
   * 
   * @returns 星标联系人列表
   */
  async getStarredContacts(): Promise<Contact[]> {
    const contacts = await this.getContacts()
    return contacts.filter(contact => contact.isStarred)
  }

  /**
   * 获取最近联系人
   * （根据最后交互时间排序）
   * 
   * @param limit 返回数量
   * @returns 最近联系人列表
   */
  async getRecentContacts(limit = 20): Promise<Contact[]> {
    const contacts = await this.getContacts({ limit })
    return contacts.sort((a, b) => {
      const timeA = a.lastContactTime || 0
      const timeB = b.lastContactTime || 0
      return timeB - timeA
    })
  }

  /**
   * 获取群聊成员
   * 
   * @param chatroomId 群聊 ID
   * @returns 群成员列表
   */
  async getChatroomMembers(chatroomId: string): Promise<Contact[]> {
    const chatroom = await this.getContactDetail(chatroomId)
    if (!chatroom.memberList) {
      return []
    }

    // 批量获取成员详情
    const memberPromises = chatroom.memberList.map(wxid => 
      this.getContactDetail(wxid).catch(() => null)
    )
    const members = await request.all<Contact>(memberPromises)
    
    return members.filter((m): m is Contact => m !== null)
  }

  /**
   * 获取联系人统计信息
   * 
   * @returns 统计信息
   */
  async getContactStats(): Promise<{
    total: number
    friends: number
    chatrooms: number
    official: number
    starred: number
  }> {
    const [all, friends, chatrooms, official, starred] = await Promise.all([
      this.getAllContacts(),
      this.getFriends(),
      this.getChatrooms(),
      this.getOfficialAccounts(),
      this.getStarredContacts(),
    ])

    return {
      total: all.length,
      friends: friends.length,
      chatrooms: chatrooms.length,
      official: official.length,
      starred: starred.length,
    }
  }

  /**
   * 批量获取联系人详情
   * 
   * @param wxids 联系人微信 ID 列表
   * @returns 联系人详情列表
   */
  async getBatchContactDetails(wxids: string[]): Promise<Contact[]> {
    const promises = wxids.map(wxid => 
      this.getContactDetail(wxid).catch(() => null)
    )
    const contacts = await request.all<Contact>(promises)
    return contacts.filter((c): c is Contact => c !== null)
  }

  /**
   * 获取联系人显示名称
   * （优先级：备注 > 昵称 > 别名 > 微信号）
   * 
   * @param contact 联系人对象
   * @returns 显示名称
   */
  getDisplayName(contact: Contact): string {
    return contact.remark || contact.nickname || contact.alias || contact.wxid
  }

  /**
   * 获取首字母（简单实现）
   * 
   * @param name 名称
   * @returns 首字母
   */
  private getFirstLetter(name: string): string {
    if (!name) return '#'
    
    const firstChar = name.charAt(0).toUpperCase()
    
    // 如果是英文字母
    if (/[A-Z]/.test(firstChar)) {
      return firstChar
    }
    
    // 其他字符归类到 #
    return '#'
  }
}

/**
 * 导出单例
 */
export const contactAPI = new ContactAPI()

/**
 * 默认导出
 */
export default contactAPI