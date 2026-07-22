export const STAY_PLANS = {
  'standard-stay': { id: 'standard-stay', name: 'Standard Stay', rate: 399, unit: 'night' },
  'private-stay': { id: 'private-stay', name: 'Private Stay', rate: 499, unit: 'night' },
  'day-care': { id: 'day-care', name: 'Day Care', rate: 299, unit: 'day' },
  'hourly-stay': { id: 'hourly-stay', name: 'Hourly Stay', rate: 50, unit: 'hour' },
}

export const FIRST_TIME_DISCOUNT = 100

export function nightsBetween(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0
  const start = new Date(checkIn)
  const end = new Date(checkOut)
  const diffMs = end.setHours(0, 0, 0, 0) - start.setHours(0, 0, 0, 0)
  const nights = Math.round(diffMs / (1000 * 60 * 60 * 24))
  return Math.max(nights, 0)
}

export function calculateBoardingTotal({ stayPlanId, checkIn, checkOut, hours = 1 }) {
  const plan = STAY_PLANS[stayPlanId]
  if (!plan) {
    return { subtotal: 0, nights: 0, hours: 0, plan: null }
  }

  if (plan.unit === 'hour') {
    const safeHours = Math.max(Number(hours) || 1, 1)
    return {
      subtotal: plan.rate * safeHours,
      nights: 0,
      hours: safeHours,
      plan,
    }
  }

  if (plan.unit === 'day') {
    return {
      subtotal: plan.rate,
      nights: 0,
      hours: 0,
      plan,
    }
  }

  const nights = Math.max(nightsBetween(checkIn, checkOut), 1)
  return {
    subtotal: plan.rate * nights,
    nights,
    hours: 0,
    plan,
  }
}

export function applyFirstTimeDiscount(subtotal, isFirstTime) {
  const discount = isFirstTime && subtotal > 0 ? Math.min(FIRST_TIME_DISCOUNT, subtotal) : 0
  return {
    discountAmount: discount,
    firstTimeDiscountApplied: discount > 0,
    total: Math.max(subtotal - discount, 0),
  }
}
