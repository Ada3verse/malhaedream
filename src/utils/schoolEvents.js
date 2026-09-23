import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

const SCHOOL_EVENTS_COLLECTION = 'school_events'
const MS_PER_DAY = 24 * 60 * 60 * 1000
const DEFAULT_UPCOMING_LIMIT = 3

function toDateOnly(dateInput) {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput)
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function daysBetween(from, to) {
  return Math.round((toDateOnly(to) - toDateOnly(from)) / MS_PER_DAY)
}

export async function getAllSchoolEvents() {
  const snapshot = await getDocs(collection(db, SCHOOL_EVENTS_COLLECTION))

  return snapshot.docs
    .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
    .sort((a, b) => (a.startDate ?? '').localeCompare(b.startDate ?? ''))
}

export async function addSchoolEvent(data) {
  await addDoc(collection(db, SCHOOL_EVENTS_COLLECTION), {
    ...data,
    createdAt: serverTimestamp(),
  })
}

export async function deleteSchoolEvent(id) {
  await deleteDoc(doc(db, SCHOOL_EVENTS_COLLECTION, id))
}

export async function getUpcomingEvents(referenceDate = new Date(), limit = DEFAULT_UPCOMING_LIMIT) {
  const events = await getAllSchoolEvents()

  return events
    .map((event) => ({
      ...event,
      daysUntilStart: daysBetween(referenceDate, event.startDate),
    }))
    .filter((event) => event.daysUntilStart >= 0 && event.daysUntilStart <= (event.reminderDays ?? 0))
    .sort((a, b) => a.daysUntilStart - b.daysUntilStart)
    .slice(0, limit)
}

export async function getCurrentEvents(referenceDate = new Date()) {
  const events = await getAllSchoolEvents()

  return events.filter((event) => {
    const daysSinceStart = daysBetween(event.startDate, referenceDate)
    const daysUntilEnd = daysBetween(referenceDate, event.endDate ?? event.startDate)
    return daysSinceStart >= 0 && daysUntilEnd >= 0
  })
}
