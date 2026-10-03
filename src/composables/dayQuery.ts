import { computed, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

// The day being looked at lives in the URL (?date=YYYY-MM-DD) and is never in the future.
export function useDayQuery(today: Ref<string | null>) {
  const route = useRoute()
  const router = useRouter()

  const date = computed(() => {
    const q = route.query.date
    if (typeof q === 'string' && ISO_DATE_RE.test(q) && today.value && q <= today.value) return q
    return today.value
  })
  const isToday = computed(() => date.value === today.value)

  function goTo(next: string): boolean {
    if (!today.value || next > today.value) return false
    router.replace({ query: next === today.value ? {} : { date: next } })
    return true
  }

  return { date, isToday, goTo }
}
