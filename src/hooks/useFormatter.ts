import { useTranslation } from 'react-i18next'
import { useLanguage } from './useLanguage'
import { useMemo } from 'react'

export function useFormatter() {
  const { currentLanguage } = useLanguage()
  const { t } = useTranslation(['common', 'errors'])

  // Create locale-specific formatters
  const locale = useMemo(() => {
    return currentLanguage === 'ru' ? 'ru-RU' : 'en-US'
  }, [currentLanguage])

  // Date formatting
  const formatDate = useMemo(() => {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }, [locale])

  const formatDateShort = useMemo(() => {
    return new Intl.DateTimeFormat(locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }, [locale])

  const formatTime = useMemo(() => {
    return new Intl.DateTimeFormat(locale, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: currentLanguage === 'en'
    })
  }, [locale, currentLanguage])

  const formatDateTime = useMemo(() => {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: currentLanguage === 'en'
    })
  }, [locale, currentLanguage])

  // Number formatting
  const formatNumber = useMemo(() => {
    return new Intl.NumberFormat(locale)
  }, [locale])

  const formatPercent = useMemo(() => {
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: 0,
      maximumFractionDigits: 1
    })
  }, [locale])

  // Relative time formatting
  const formatRelativeTime = (date: string | Date): string => {
    const now = new Date()
    const target = new Date(date)
    const diffMs = target.getTime() - now.getTime()
    const diffSeconds = Math.floor(diffMs / 1000)
    const diffMinutes = Math.floor(diffSeconds / 60)
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)

    // Future times (starts in...)
    if (diffMs > 0) {
      if (diffDays > 0) {
        return t('time.days', { count: diffDays })
      } else if (diffHours > 0) {
        return t('time.hours', { count: diffHours })
      } else if (diffMinutes > 0) {
        return t('time.minutes', { count: diffMinutes })
      } else {
        return t('time.soon', 'Soon')
      }
    }

    // Past times (ended ... ago)
    const absDiffMs = Math.abs(diffMs)
    const absDiffSeconds = Math.floor(absDiffMs / 1000)
    const absDiffMinutes = Math.floor(absDiffSeconds / 60)
    const absDiffHours = Math.floor(absDiffMinutes / 60)
    const absDiffDays = Math.floor(absDiffHours / 24)

    if (absDiffDays > 0) {
      return t('time.days', { count: absDiffDays })
    } else if (absDiffHours > 0) {
      return t('time.hours', { count: absDiffHours })
    } else if (absDiffMinutes > 0) {
      return t('time.minutes', { count: absDiffMinutes })
    } else {
      return t('time.now', 'Just now')
    }
  }

  // Time remaining/elapsed with context
  const formatTimeContext = (date: string | Date, context: 'remaining' | 'ago'): string => {
    const timeString = formatRelativeTime(date)
    return context === 'remaining' 
      ? t('time.remaining', '{{time}} remaining', { time: timeString })
      : t('time.ago', '{{time}} ago', { time: timeString })
  }

  // Smart pluralization helper
  const getPlural = (count: number, key: string): string => {
    if (currentLanguage === 'ru') {
      // Russian pluralization rules
      const mod10 = count % 10
      const mod100 = count % 100
      
      if (mod100 >= 11 && mod100 <= 14) {
        return t(`${key}_many`, { count })
      } else if (mod10 === 1) {
        return t(key, { count })
      } else if (mod10 >= 2 && mod10 <= 4) {
        return t(`${key}_2`, { count })
      } else {
        return t(`${key}_many`, { count })
      }
    } else {
      // English pluralization
      return t(key, { count })
    }
  }

  // Format member count with proper pluralization
  const formatMemberCount = (count: number): string => {
    return getPlural(count, 'company:party.members')
  }

  // Format vote count
  const formatVoteCount = (count: number): string => {
    return getPlural(count, 'discussions:detail.votes.totalVotes')
  }

  // Format comment count
  const formatCommentCount = (count: number): string => {
    return getPlural(count, 'discussions:detail.comments.totalComments')
  }

  return {
    // Basic formatters
    formatDate: (date: string | Date) => formatDate.format(new Date(date)),
    formatDateShort: (date: string | Date) => formatDateShort.format(new Date(date)),
    formatTime: (date: string | Date) => formatTime.format(new Date(date)),
    formatDateTime: (date: string | Date) => formatDateTime.format(new Date(date)),
    formatNumber: (num: number) => formatNumber.format(num),
    formatPercent: (num: number) => formatPercent.format(num),
    
    // Advanced formatters
    formatRelativeTime,
    formatTimeContext,
    
    // Count formatters with pluralization
    formatMemberCount,
    formatVoteCount, 
    formatCommentCount,
    
    // Generic plural helper
    getPlural,
    
    // Current locale info
    locale,
    isRussian: currentLanguage === 'ru'
  }
}
