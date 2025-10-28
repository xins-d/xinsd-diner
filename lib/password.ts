import bcrypt from 'bcryptjs'

// 密码安全配置
const SALT_ROUNDS = 12

// 密码强度要求
export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
} as const

// 密码验证错误类型
export enum PasswordErrorType {
  TOO_SHORT = 'TOO_SHORT',
  NO_UPPERCASE = 'NO_UPPERCASE',
  NO_LOWERCASE = 'NO_LOWERCASE',
  NO_NUMBERS = 'NO_NUMBERS',
  NO_SPECIAL_CHARS = 'NO_SPECIAL_CHARS',
}

export interface PasswordValidationResult {
  isValid: boolean
  errors: PasswordErrorType[]
  message?: string
}

/**
 * 验证密码强度
 * @param password 要验证的密码
 * @returns 验证结果
 */
export function validatePasswordStrength(password: string): PasswordValidationResult {
  const errors: PasswordErrorType[] = []
  
  // 检查长度
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(PasswordErrorType.TOO_SHORT)
  }
  
  // 检查大写字母
  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push(PasswordErrorType.NO_UPPERCASE)
  }
  
  // 检查小写字母
  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push(PasswordErrorType.NO_LOWERCASE)
  }
  
  // 检查数字
  if (PASSWORD_REQUIREMENTS.requireNumbers && !/\d/.test(password)) {
    errors.push(PasswordErrorType.NO_NUMBERS)
  }
  
  // 检查特殊字符
  if (PASSWORD_REQUIREMENTS.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push(PasswordErrorType.NO_SPECIAL_CHARS)
  }
  
  const isValid = errors.length === 0
  
  let message: string | undefined
  if (!isValid) {
    const errorMessages = {
      [PasswordErrorType.TOO_SHORT]: `密码长度至少${PASSWORD_REQUIREMENTS.minLength}位`,
      [PasswordErrorType.NO_UPPERCASE]: '密码必须包含大写字母',
      [PasswordErrorType.NO_LOWERCASE]: '密码必须包含小写字母',
      [PasswordErrorType.NO_NUMBERS]: '密码必须包含数字',
      [PasswordErrorType.NO_SPECIAL_CHARS]: '密码必须包含特殊字符',
    }
    
    message = errors.map(error => errorMessages[error]).join('，')
  }
  
  return {
    isValid,
    errors,
    message,
  }
}

/**
 * 生成密码哈希
 * @param password 明文密码
 * @returns Promise<string> 密码哈希
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS)
    const hash = await bcrypt.hash(password, salt)
    return hash
  } catch (error) {
    throw new Error('密码哈希生成失败')
  }
}

/**
 * 验证密码
 * @param password 明文密码
 * @param hash 存储的密码哈希
 * @returns Promise<boolean> 验证结果
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash)
  } catch (error) {
    return false
  }
}

/**
 * 生成随机密码
 * @param length 密码长度，默认12位
 * @returns 随机密码
 */
export function generateRandomPassword(length: number = 12): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?'
  
  const allChars = uppercase + lowercase + numbers + specialChars
  
  let password = ''
  
  // 确保至少包含每种类型的字符
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += specialChars[Math.floor(Math.random() * specialChars.length)]
  
  // 填充剩余长度
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }
  
  // 打乱字符顺序
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

/**
 * 检查密码是否需要更新（基于哈希算法版本）
 * @param hash 当前密码哈希
 * @returns 是否需要重新哈希
 */
export function shouldRehashPassword(hash: string): boolean {
  try {
    // 检查是否使用了当前的salt rounds
    return bcrypt.getRounds(hash) < SALT_ROUNDS
  } catch (error) {
    // 如果无法解析哈希，说明格式有问题，需要重新哈希
    return true
  }
}

/**
 * 获取密码强度评分
 * @param password 密码
 * @returns 强度评分 (0-100)
 */
export function getPasswordStrength(password: string): number {
  let score = 0
  
  // 长度评分 (最多30分)
  if (password.length >= 8) score += 10
  if (password.length >= 12) score += 10
  if (password.length >= 16) score += 10
  
  // 字符类型评分 (每种类型15分)
  if (/[a-z]/.test(password)) score += 15
  if (/[A-Z]/.test(password)) score += 15
  if (/\d/.test(password)) score += 15
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 15
  
  // 复杂度评分 (最多10分)
  const uniqueChars = new Set(password).size
  if (uniqueChars >= password.length * 0.7) score += 10
  
  return Math.min(score, 100)
}

/**
 * 获取密码强度描述
 * @param password 密码
 * @returns 强度描述
 */
export function getPasswordStrengthDescription(password: string): string {
  const score = getPasswordStrength(password)
  
  if (score < 30) return '弱'
  if (score < 60) return '中等'
  if (score < 80) return '强'
  return '很强'
}