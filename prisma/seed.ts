import { randomUUID } from 'crypto';
import {
  ActivityKind,
  MedicationType,
  PrismaClient,
  Role,
} from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();
const DEFAULT_PASSWORD = '12345678';

type SnapshotSeed = {
  currentWeightLbs: number;
  goalWeightLbs: number;
  medicationType: string;
  dose: { name: string; value: number; unit: string };
  nextAppointment: { id: string; startsAt: string };
};

type RecordSeed = {
  id: string;
  medication: string;
  medicationType: MedicationType;
  startDate: string;
  endDate: string;
  purchasedAt: string;
  renewalDate: string;
  notes: string;
};

type ShotSeed = {
  id: string;
  date: string;
  medication: string;
  doseValue: number;
  doseUnit: string;
  site: string;
  painLevel: number;
  weightKg: number;
  caloriesAvg: number;
  proteinAvgG: number;
  notes: string;
};

type ActivitySeed = {
  id: string;
  kind: ActivityKind;
  title: string;
  subtitle: string;
  occurredAt: string;
};

type PatientSeed = {
  profile: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    avatarUrl: string;
  };
  shipping: {
    fullName: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
  };
  snapshot: SnapshotSeed;
  records: RecordSeed[];
  shots: ShotSeed[];
  activities: ActivitySeed[];
};

const patientSeeds: PatientSeed[] = [
  {
    profile: {
      firstName: 'Sarah',
      lastName: 'Adams',
      email: 'sarah.adams@example.com',
      phone: '+1 (555) 010-2000',
      avatarUrl: 'https://i.pravatar.cc/150?img=1',
    },
    shipping: {
      fullName: 'Sarah Adams',
      address1: '123 Ocean Ave',
      address2: 'Unit 4B',
      city: 'Miami',
      state: 'FL',
      postalCode: '33101',
      country: 'USA',
      phone: '+1 (555) 010-2000',
    },
    snapshot: {
      currentWeightLbs: 165,
      goalWeightLbs: 150,
      medicationType: 'Semaglutide',
      dose: { name: 'Semaglutide', value: 1.0, unit: 'mg' },
      nextAppointment: {
        id: 'apt_sarah_2025_10_20',
        startsAt: '2025-10-20T14:00:00.000Z',
      },
    },
    records: [
      {
        id: 'rec_sarah_1',
        medication: 'Semaglutide',
        medicationType: MedicationType.INJECTABLE,
        startDate: '2025-09-01T00:00:00.000Z',
        endDate: '2025-11-24T00:00:00.000Z',
        purchasedAt: '2025-09-01T10:20:00.000Z',
        renewalDate: '2025-11-24T00:00:00.000Z',
        notes: 'Weekly injections with nutrition consult.',
      },
      {
        id: 'rec_sarah_2',
        medication: 'Tirzepatide',
        medicationType: MedicationType.INJECTABLE,
        startDate: '2025-07-10T00:00:00.000Z',
        endDate: '2025-10-10T00:00:00.000Z',
        purchasedAt: '2025-07-10T09:05:00.000Z',
        renewalDate: '2025-10-10T00:00:00.000Z',
        notes: 'Transitioned from Semaglutide to Tirzepatide.',
      },
    ],
    shots: [
      {
        id: 'shot_sarah_1',
        date: '2025-08-18T10:59:00.000Z',
        medication: 'Tirzepatide',
        doseValue: 7.5,
        doseUnit: 'mg',
        site: 'Stomach - Upper Left',
        painLevel: 1,
        weightKg: 89.3,
        caloriesAvg: 2000,
        proteinAvgG: 89,
        notes: 'Felt fine.',
      },
    ],
    activities: [
      {
        id: 'act_sarah_1',
        kind: ActivityKind.INJECTION,
        title: 'Logged injection',
        subtitle: '1.0 mg Semaglutide',
        occurredAt: '2025-10-24T10:00:00.000Z',
      },
      {
        id: 'act_sarah_2',
        kind: ActivityKind.WEIGHT,
        title: 'Logged weight',
        subtitle: '165 lbs',
        occurredAt: '2025-10-23T11:20:00.000Z',
      },
      {
        id: 'act_sarah_3',
        kind: ActivityKind.WORKOUT,
        title: 'Completed workout',
        subtitle: '30 min cardio',
        occurredAt: '2025-10-22T18:45:00.000Z',
      },
      {
        id: 'act_sarah_4',
        kind: ActivityKind.MESSAGE,
        title: 'Message from provider',
        subtitle: 'Great progress!',
        occurredAt: '2025-10-20T09:05:00.000Z',
      },
    ],
  },
  {
    profile: {
      firstName: 'David',
      lastName: 'Chen',
      email: 'david.chen@example.com',
      phone: '+1 (555) 010-2001',
      avatarUrl: 'https://i.pravatar.cc/150?img=2',
    },    shipping: {
      fullName: 'David Chen',
      address1: '88 Market Street',
      address2: 'Floor 12',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94105',
      country: 'USA',
      phone: '+1 (555) 010-2001',
    },
    snapshot: {
      currentWeightLbs: 210,
      goalWeightLbs: 185,
      medicationType: 'Tirzepatide',
      dose: { name: 'Tirzepatide', value: 5.0, unit: 'mg' },
      nextAppointment: {
        id: 'apt_david_2025_11_02',
        startsAt: '2025-11-02T16:30:00.000Z',
      },
    },
    records: [
      {
        id: 'rec_david_1',
        medication: 'Tirzepatide',
        medicationType: MedicationType.INJECTABLE,
        startDate: '2025-08-15T00:00:00.000Z',
        endDate: '2025-12-15T00:00:00.000Z',
        purchasedAt: '2025-08-15T08:45:00.000Z',
        renewalDate: '2025-12-15T00:00:00.000Z',
        notes: 'Monthly follow-up recommended.',
      },
      {
        id: 'rec_david_2',
        medication: 'Metformin',
        medicationType: MedicationType.ORAL,
        startDate: '2025-06-01T00:00:00.000Z',
        endDate: '2025-09-01T00:00:00.000Z',
        purchasedAt: '2025-06-01T12:00:00.000Z',
        renewalDate: '2025-09-01T00:00:00.000Z',
        notes: 'Adjunct metabolic support.',
      },
    ],
    shots: [
      {
        id: 'shot_david_1',
        date: '2025-09-05T12:15:00.000Z',
        medication: 'Tirzepatide',
        doseValue: 5.0,
        doseUnit: 'mg',
        site: 'Left thigh',
        painLevel: 2,
        weightKg: 95.2,
        caloriesAvg: 2300,
        proteinAvgG: 105,
        notes: 'Mild soreness afterwards.',
      },
    ],
    activities: [
      {
        id: 'act_david_1',
        kind: ActivityKind.INJECTION,
        title: 'Logged injection',
        subtitle: '5 mg Tirzepatide',
        occurredAt: '2025-10-25T09:30:00.000Z',
      },
      {
        id: 'act_david_2',
        kind: ActivityKind.WEIGHT,
        title: 'Logged weight',
        subtitle: '210 lbs',
        occurredAt: '2025-10-23T07:45:00.000Z',
      },
      {
        id: 'act_david_3',
        kind: ActivityKind.SHOT,
        title: 'Tracked shot site',
        subtitle: 'Left thigh',
        occurredAt: '2025-10-20T10:05:00.000Z',
      },
      {
        id: 'act_david_4',
        kind: ActivityKind.NOTE,
        title: 'Weekly nutrition log',
        subtitle: 'Increased protein intake',
        occurredAt: '2025-10-18T13:15:00.000Z',
      },
    ],
  },
  {
    profile: {
      firstName: 'Maria',
      lastName: 'Gonzalez',
      email: 'maria.gonzalez@example.com',
      phone: '+1 (555) 010-2002',
      avatarUrl: 'https://i.pravatar.cc/150?img=3',
    },    shipping: {
      fullName: 'Maria Gonzalez',
      address1: '402 Sunset Blvd',
      city: 'Los Angeles',
      state: 'CA',
      postalCode: '90049',
      country: 'USA',
      phone: '+1 (555) 010-2002',
    },
    snapshot: {
      currentWeightLbs: 178,
      goalWeightLbs: 160,
      medicationType: 'Semaglutide',
      dose: { name: 'Semaglutide', value: 0.5, unit: 'mg' },
      nextAppointment: {
        id: 'apt_maria_2025_10_30',
        startsAt: '2025-10-30T17:15:00.000Z',
      },
    },
    records: [
      {
        id: 'rec_maria_1',
        medication: 'Semaglutide',
        medicationType: MedicationType.INJECTABLE,
        startDate: '2025-08-01T00:00:00.000Z',
        endDate: '2025-11-01T00:00:00.000Z',
        purchasedAt: '2025-08-01T09:45:00.000Z',
        renewalDate: '2025-11-01T00:00:00.000Z',
        notes: 'Responding well to treatment.',
      },
      {
        id: 'rec_maria_2',
        medication: 'Vitamin B12',
        medicationType: MedicationType.INJECTABLE,
        startDate: '2025-07-15T00:00:00.000Z',
        endDate: '2025-12-15T00:00:00.000Z',
        purchasedAt: '2025-07-15T11:30:00.000Z',
        renewalDate: '2025-12-15T00:00:00.000Z',
        notes: 'Monthly supplementation.',
      },
    ],
    shots: [
      {
        id: 'shot_maria_1',
        date: '2025-09-12T08:00:00.000Z',
        medication: 'Semaglutide',
        doseValue: 0.5,
        doseUnit: 'mg',
        site: 'Right arm',
        painLevel: 0,
        weightKg: 80.7,
        caloriesAvg: 2100,
        proteinAvgG: 95,
        notes: 'No issues reported.',
      },
    ],
    activities: [
      {
        id: 'act_maria_1',
        kind: ActivityKind.INJECTION,
        title: 'Logged injection',
        subtitle: '0.5 mg Semaglutide',
        occurredAt: '2025-10-24T07:00:00.000Z',
      },
      {
        id: 'act_maria_2',
        kind: ActivityKind.WEIGHT,
        title: 'Logged weight',
        subtitle: '178 lbs',
        occurredAt: '2025-10-22T07:15:00.000Z',
      },
      {
        id: 'act_maria_3',
        kind: ActivityKind.MESSAGE,
        title: 'Provider note',
        subtitle: 'Consider increasing hydration',
        occurredAt: '2025-10-19T12:30:00.000Z',
      },
      {
        id: 'act_maria_4',
        kind: ActivityKind.WORKOUT,
        title: 'Workout logged',
        subtitle: '45 min yoga',
        occurredAt: '2025-10-18T18:30:00.000Z',
      },
    ],
  },
  {
    profile: {
      firstName: 'Liam',
      lastName: "O'Connor",
      email: 'liam.oconnor@example.com',
      phone: '+1 (555) 010-2003',
      avatarUrl: 'https://i.pravatar.cc/150?img=4',
    },    shipping: {
      fullName: "Liam O'Connor",
      address1: '14 Harbor Way',
      city: 'Boston',
      state: 'MA',
      postalCode: '02108',
      country: 'USA',
      phone: '+1 (555) 010-2003',
    },
    snapshot: {
      currentWeightLbs: 195,
      goalWeightLbs: 175,
      medicationType: 'Semaglutide',
      dose: { name: 'Semaglutide', value: 0.75, unit: 'mg' },
      nextAppointment: {
        id: 'apt_liam_2025_11_12',
        startsAt: '2025-11-12T13:30:00.000Z',
      },
    },
    records: [
      {
        id: 'rec_liam_1',
        medication: 'Semaglutide',
        medicationType: MedicationType.INJECTABLE,
        startDate: '2025-07-20T00:00:00.000Z',
        endDate: '2025-10-20T00:00:00.000Z',
        purchasedAt: '2025-07-20T14:00:00.000Z',
        renewalDate: '2025-10-20T00:00:00.000Z',
        notes: 'Improved appetite control noted.',
      },
      {
        id: 'rec_liam_2',
        medication: 'Orlistat',
        medicationType: MedicationType.ORAL,
        startDate: '2025-05-01T00:00:00.000Z',
        endDate: '2025-08-01T00:00:00.000Z',
        purchasedAt: '2025-05-01T09:10:00.000Z',
        renewalDate: '2025-08-01T00:00:00.000Z',
        notes: 'Discontinued after starting Semaglutide.',
      },
    ],
    shots: [
      {
        id: 'shot_liam_1',
        date: '2025-09-01T09:30:00.000Z',
        medication: 'Semaglutide',
        doseValue: 0.75,
        doseUnit: 'mg',
        site: 'Right thigh',
        painLevel: 1,
        weightKg: 88.6,
        caloriesAvg: 2200,
        proteinAvgG: 102,
        notes: 'Slight redness at injection site.',
      },
    ],
    activities: [
      {
        id: 'act_liam_1',
        kind: ActivityKind.INJECTION,
        title: 'Logged injection',
        subtitle: '0.75 mg Semaglutide',
        occurredAt: '2025-10-21T08:00:00.000Z',
      },
      {
        id: 'act_liam_2',
        kind: ActivityKind.WEIGHT,
        title: 'Logged weight',
        subtitle: '195 lbs',
        occurredAt: '2025-10-19T08:00:00.000Z',
      },
      {
        id: 'act_liam_3',
        kind: ActivityKind.WORKOUT,
        title: 'Completed workout',
        subtitle: 'Peloton ride 35 min',
        occurredAt: '2025-10-18T23:00:00.000Z',
      },
      {
        id: 'act_liam_4',
        kind: ActivityKind.MESSAGE,
        title: 'Message from coach',
        subtitle: 'Remember hydration goals',
        occurredAt: '2025-10-16T06:45:00.000Z',
      },
    ],
  },
  {
    profile: {
      firstName: 'Priya',
      lastName: 'Patel',
      email: 'priya.patel@example.com',
      phone: '+1 (555) 010-2004',
      avatarUrl: 'https://i.pravatar.cc/150?img=5',
    },    shipping: {
      fullName: 'Priya Patel',
      address1: '910 Lake Shore Dr',
      city: 'Chicago',
      state: 'IL',
      postalCode: '60611',
      country: 'USA',
      phone: '+1 (555) 010-2004',
    },
    snapshot: {
      currentWeightLbs: 172,
      goalWeightLbs: 152,
      medicationType: 'Tirzepatide',
      dose: { name: 'Tirzepatide', value: 2.5, unit: 'mg' },
      nextAppointment: {
        id: 'apt_priya_2025_11_05',
        startsAt: '2025-11-05T15:00:00.000Z',
      },
    },
    records: [
      {
        id: 'rec_priya_1',
        medication: 'Tirzepatide',
        medicationType: MedicationType.INJECTABLE,
        startDate: '2025-09-05T00:00:00.000Z',
        endDate: '2025-12-05T00:00:00.000Z',
        purchasedAt: '2025-09-05T13:50:00.000Z',
        renewalDate: '2025-12-05T00:00:00.000Z',
        notes: 'Dose escalation planned after month 1.',
      },
      {
        id: 'rec_priya_2',
        medication: 'Lifestyle coaching',
        medicationType: MedicationType.OTHER,
        startDate: '2025-06-01T00:00:00.000Z',
        endDate: '2025-09-01T00:00:00.000Z',
        purchasedAt: '2025-06-01T09:00:00.000Z',
        renewalDate: '2025-09-01T00:00:00.000Z',
        notes: 'Weekly virtual sessions.',
      },
    ],
    shots: [
      {
        id: 'shot_priya_1',
        date: '2025-09-15T14:05:00.000Z',
        medication: 'Tirzepatide',
        doseValue: 2.5,
        doseUnit: 'mg',
        site: 'Left arm',
        painLevel: 0,
        weightKg: 78.0,
        caloriesAvg: 1900,
        proteinAvgG: 85,
        notes: 'No side effects observed.',
      },
    ],
    activities: [
      {
        id: 'act_priya_1',
        kind: ActivityKind.INJECTION,
        title: 'Logged injection',
        subtitle: '2.5 mg Tirzepatide',
        occurredAt: '2025-10-23T15:20:00.000Z',
      },
      {
        id: 'act_priya_2',
        kind: ActivityKind.WEIGHT,
        title: 'Logged weight',
        subtitle: '172 lbs',
        occurredAt: '2025-10-22T06:45:00.000Z',
      },
      {
        id: 'act_priya_3',
        kind: ActivityKind.MESSAGE,
        title: 'Confirmed telehealth follow-up',
        subtitle: 'Set reminders',
        occurredAt: '2025-10-20T12:30:00.000Z',
      },
      {
        id: 'act_priya_4',
        kind: ActivityKind.NOTE,
        title: 'Meal plan updated',
        subtitle: 'Added high-protein snacks',
        occurredAt: '2025-10-18T17:10:00.000Z',
      },
    ],
  },
  {
    profile: {
      firstName: 'Ethan',
      lastName: 'Brown',
      email: 'ethan.brown@example.com',
      phone: '+1 (555) 010-2005',
      avatarUrl: 'https://i.pravatar.cc/150?img=6',
    },    shipping: {
      fullName: 'Ethan Brown',
      address1: '55 Pine Street',
      city: 'Seattle',
      state: 'WA',
      postalCode: '98101',
      country: 'USA',
      phone: '+1 (555) 010-2005',
    },
    snapshot: {
      currentWeightLbs: 240,
      goalWeightLbs: 210,
      medicationType: 'Semaglutide',
      dose: { name: 'Semaglutide', value: 1.25, unit: 'mg' },
      nextAppointment: {
        id: 'apt_ethan_2025_11_18',
        startsAt: '2025-11-18T18:00:00.000Z',
      },
    },
    records: [
      {
        id: 'rec_ethan_1',
        medication: 'Semaglutide',
        medicationType: MedicationType.INJECTABLE,
        startDate: '2025-08-20T00:00:00.000Z',
        endDate: '2025-12-20T00:00:00.000Z',
        purchasedAt: '2025-08-20T10:35:00.000Z',
        renewalDate: '2025-12-20T00:00:00.000Z',
        notes: 'Monitoring blood pressure alongside treatment.',
      },
      {
        id: 'rec_ethan_2',
        medication: 'Behavioral coaching',
        medicationType: MedicationType.OTHER,
        startDate: '2025-07-01T00:00:00.000Z',
        endDate: '2025-10-01T00:00:00.000Z',
        purchasedAt: '2025-07-01T14:40:00.000Z',
        renewalDate: '2025-10-01T00:00:00.000Z',
        notes: 'Bi-weekly coaching sessions.',
      },
    ],
    shots: [
      {
        id: 'shot_ethan_1',
        date: '2025-09-10T09:10:00.000Z',
        medication: 'Semaglutide',
        doseValue: 1.25,
        doseUnit: 'mg',
        site: 'Right arm',
        painLevel: 2,
        weightKg: 108.9,
        caloriesAvg: 2600,
        proteinAvgG: 115,
        notes: 'Slight nausea afterwards.',
      },
    ],
    activities: [
      {
        id: 'act_ethan_1',
        kind: ActivityKind.INJECTION,
        title: 'Logged injection',
        subtitle: '1.25 mg Semaglutide',
        occurredAt: '2025-10-21T14:45:00.000Z',
      },
      {
        id: 'act_ethan_2',
        kind: ActivityKind.WEIGHT,
        title: 'Logged weight',
        subtitle: '240 lbs',
        occurredAt: '2025-10-19T09:30:00.000Z',
      },
      {
        id: 'act_ethan_3',
        kind: ActivityKind.NOTE,
        title: 'Symptoms journal',
        subtitle: 'Mild nausea after injection',
        occurredAt: '2025-10-18T20:15:00.000Z',
      },
      {
        id: 'act_ethan_4',
        kind: ActivityKind.SHOT,
        title: 'Recorded shot site',
        subtitle: 'Right arm (alternate to thigh)',
        occurredAt: '2025-10-16T10:00:00.000Z',
      },
    ],
  },
  {
    profile: {
      firstName: 'Olivia',
      lastName: 'Martin',
      email: 'olivia.martin@example.com',
      phone: '+1 (555) 010-2006',
      avatarUrl: 'https://i.pravatar.cc/150?img=7',
    },    shipping: {
      fullName: 'Olivia Martin',
      address1: '67 Garden Lane',
      city: 'Austin',
      state: 'TX',
      postalCode: '73301',
      country: 'USA',
      phone: '+1 (555) 010-2006',
    },
    snapshot: {
      currentWeightLbs: 142,
      goalWeightLbs: 130,
      medicationType: 'Lifestyle Plan',
      dose: { name: 'Protein supplement', value: 30, unit: 'g' },
      nextAppointment: {
        id: 'apt_olivia_2025_11_09',
        startsAt: '2025-11-09T16:00:00.000Z',
      },
    },
    records: [
      {
        id: 'rec_olivia_1',
        medication: 'Nutrition coaching',
        medicationType: MedicationType.OTHER,
        startDate: '2025-05-10T00:00:00.000Z',
        endDate: '2025-08-10T00:00:00.000Z',
        purchasedAt: '2025-05-10T09:30:00.000Z',
        renewalDate: '2025-08-10T00:00:00.000Z',
        notes: 'Focus on macro-balanced meals.',
      },
      {
        id: 'rec_olivia_2',
        medication: 'Semaglutide',
        medicationType: MedicationType.INJECTABLE,
        startDate: '2025-08-20T00:00:00.000Z',
        endDate: '2025-11-20T00:00:00.000Z',
        purchasedAt: '2025-08-20T11:45:00.000Z',
        renewalDate: '2025-11-20T00:00:00.000Z',
        notes: 'Started low dose under supervision.',
      },
    ],
    shots: [
      {
        id: 'shot_olivia_1',
        date: '2025-09-25T07:50:00.000Z',
        medication: 'Semaglutide',
        doseValue: 0.25,
        doseUnit: 'mg',
        site: 'Abdomen',
        painLevel: 1,
        weightKg: 64.4,
        caloriesAvg: 1800,
        proteinAvgG: 90,
        notes: 'No adverse effects.',
      },
    ],
    activities: [
      {
        id: 'act_olivia_1',
        kind: ActivityKind.INJECTION,
        title: 'Logged injection',
        subtitle: '0.25 mg Semaglutide',
        occurredAt: '2025-10-23T07:40:00.000Z',
      },
      {
        id: 'act_olivia_2',
        kind: ActivityKind.WEIGHT,
        title: 'Logged weight',
        subtitle: '142 lbs',
        occurredAt: '2025-10-21T07:10:00.000Z',
      },
      {
        id: 'act_olivia_3',
        kind: ActivityKind.WORKOUT,
        title: 'Completed workout',
        subtitle: 'Barre class 50 min',
        occurredAt: '2025-10-19T18:00:00.000Z',
      },
      {
        id: 'act_olivia_4',
        kind: ActivityKind.NOTE,
        title: 'Meal prep logged',
        subtitle: 'High-protein lunches',
        occurredAt: '2025-10-18T13:20:00.000Z',
      },
    ],
  },
  {
    profile: {
      firstName: 'Noah',
      lastName: 'Johnson',
      email: 'noah.johnson@example.com',
      phone: '+1 (555) 010-2007',
      avatarUrl: 'https://i.pravatar.cc/150?img=8',
    },    shipping: {
      fullName: 'Noah Johnson',
      address1: '15 River Park',
      city: 'Denver',
      state: 'CO',
      postalCode: '80202',
      country: 'USA',
      phone: '+1 (555) 010-2007',
    },
    snapshot: {
      currentWeightLbs: 188,
      goalWeightLbs: 168,
      medicationType: 'Tirzepatide',
      dose: { name: 'Tirzepatide', value: 3.0, unit: 'mg' },
      nextAppointment: {
        id: 'apt_noah_2025_11_15',
        startsAt: '2025-11-15T19:30:00.000Z',
      },
    },
    records: [
      {
        id: 'rec_noah_1',
        medication: 'Tirzepatide',
        medicationType: MedicationType.INJECTABLE,
        startDate: '2025-09-01T00:00:00.000Z',
        endDate: '2025-12-01T00:00:00.000Z',
        purchasedAt: '2025-09-01T10:00:00.000Z',
        renewalDate: '2025-12-01T00:00:00.000Z',
        notes: 'Reports increased satiety.',
      },
      {
        id: 'rec_noah_2',
        medication: 'Coaching follow-ups',
        medicationType: MedicationType.OTHER,
        startDate: '2025-06-15T00:00:00.000Z',
        endDate: '2025-09-15T00:00:00.000Z',
        purchasedAt: '2025-06-15T08:20:00.000Z',
        renewalDate: '2025-09-15T00:00:00.000Z',
        notes: 'Bi-weekly accountability calls.',
      },
    ],
    shots: [
      {
        id: 'shot_noah_1',
        date: '2025-09-18T12:25:00.000Z',
        medication: 'Tirzepatide',
        doseValue: 3.0,
        doseUnit: 'mg',
        site: 'Left abdomen',
        painLevel: 2,
        weightKg: 85.3,
        caloriesAvg: 2100,
        proteinAvgG: 98,
        notes: 'Slight bruise noted.',
      },
    ],
    activities: [
      {
        id: 'act_noah_1',
        kind: ActivityKind.INJECTION,
        title: 'Logged injection',
        subtitle: '3 mg Tirzepatide',
        occurredAt: '2025-10-22T12:30:00.000Z',
      },
      {
        id: 'act_noah_2',
        kind: ActivityKind.WEIGHT,
        title: 'Logged weight',
        subtitle: '188 lbs',
        occurredAt: '2025-10-20T07:30:00.000Z',
      },
      {
        id: 'act_noah_3',
        kind: ActivityKind.MESSAGE,
        title: 'Provider feedback',
        subtitle: 'Monitor hydration levels',
        occurredAt: '2025-10-18T09:15:00.000Z',
      },
      {
        id: 'act_noah_4',
        kind: ActivityKind.NOTE,
        title: 'Weekly summary',
        subtitle: 'Met daily step goal',
        occurredAt: '2025-10-17T20:40:00.000Z',
      },
    ],
  },
  {
    profile: {
      firstName: 'Ava',
      lastName: 'Thompson',
      email: 'ava.thompson@example.com',
      phone: '+1 (555) 010-2008',
      avatarUrl: 'https://i.pravatar.cc/150?img=9',
    },    shipping: {
      fullName: 'Ava Thompson',
      address1: '120 Maple Ridge',
      city: 'Charlotte',
      state: 'NC',
      postalCode: '28202',
      country: 'USA',
      phone: '+1 (555) 010-2008',
    },
    snapshot: {
      currentWeightLbs: 158,
      goalWeightLbs: 140,
      medicationType: 'Semaglutide',
      dose: { name: 'Semaglutide', value: 0.75, unit: 'mg' },
      nextAppointment: {
        id: 'apt_ava_2025_11_11',
        startsAt: '2025-11-11T15:15:00.000Z',
      },
    },
    records: [
      {
        id: 'rec_ava_1',
        medication: 'Semaglutide',
        medicationType: MedicationType.INJECTABLE,
        startDate: '2025-08-10T00:00:00.000Z',
        endDate: '2025-11-10T00:00:00.000Z',
        purchasedAt: '2025-08-10T10:30:00.000Z',
        renewalDate: '2025-11-10T00:00:00.000Z',
        notes: 'Steady weight loss observed.',
      },
      {
        id: 'rec_ava_2',
        medication: 'Pilates class membership',
        medicationType: MedicationType.OTHER,
        startDate: '2025-06-01T00:00:00.000Z',
        endDate: '2025-12-01T00:00:00.000Z',
        purchasedAt: '2025-06-01T11:15:00.000Z',
        renewalDate: '2025-12-01T00:00:00.000Z',
        notes: 'Encouraged for core strength.',
      },
    ],
    shots: [
      {
        id: 'shot_ava_1',
        date: '2025-09-08T07:10:00.000Z',
        medication: 'Semaglutide',
        doseValue: 0.75,
        doseUnit: 'mg',
        site: 'Right abdomen',
        painLevel: 1,
        weightKg: 71.7,
        caloriesAvg: 1850,
        proteinAvgG: 88,
        notes: 'Mild warmth afterwards.',
      },
    ],
    activities: [
      {
        id: 'act_ava_1',
        kind: ActivityKind.INJECTION,
        title: 'Logged injection',
        subtitle: '0.75 mg Semaglutide',
        occurredAt: '2025-10-21T07:20:00.000Z',
      },
      {
        id: 'act_ava_2',
        kind: ActivityKind.WEIGHT,
        title: 'Logged weight',
        subtitle: '158 lbs',
        occurredAt: '2025-10-19T07:00:00.000Z',
      },
      {
        id: 'act_ava_3',
        kind: ActivityKind.WORKOUT,
        title: 'Pilates class',
        subtitle: 'Reformer session',
        occurredAt: '2025-10-17T18:10:00.000Z',
      },
      {
        id: 'act_ava_4',
        kind: ActivityKind.NOTE,
        title: 'Meal journal',
        subtitle: 'Tracking fiber intake',
        occurredAt: '2025-10-16T12:25:00.000Z',
      },
    ],
  },
  {
    profile: {
      firstName: 'Lucas',
      lastName: 'Silva',
      email: 'lucas.silva@example.com',
      phone: '+1 (555) 010-2009',
      avatarUrl: 'https://i.pravatar.cc/150?img=10',
    },    shipping: {
      fullName: 'Lucas Silva',
      address1: '200 Pinecrest Lane',
      city: 'Orlando',
      state: 'FL',
      postalCode: '32801',
      country: 'USA',
      phone: '+1 (555) 010-2009',
    },
    snapshot: {
      currentWeightLbs: 202,
      goalWeightLbs: 180,
      medicationType: 'Tirzepatide',
      dose: { name: 'Tirzepatide', value: 4.5, unit: 'mg' },
      nextAppointment: {
        id: 'apt_lucas_2025_11_19',
        startsAt: '2025-11-19T14:45:00.000Z',
      },
    },
    records: [
      {
        id: 'rec_lucas_1',
        medication: 'Tirzepatide',
        medicationType: MedicationType.INJECTABLE,
        startDate: '2025-09-12T00:00:00.000Z',
        endDate: '2025-12-12T00:00:00.000Z',
        purchasedAt: '2025-09-12T09:00:00.000Z',
        renewalDate: '2025-12-12T00:00:00.000Z',
        notes: 'Planning to review dose in December.',
      },
      {
        id: 'rec_lucas_2',
        medication: 'Dietitian sessions',
        medicationType: MedicationType.OTHER,
        startDate: '2025-07-05T00:00:00.000Z',
        endDate: '2025-10-05T00:00:00.000Z',
        purchasedAt: '2025-07-05T10:10:00.000Z',
        renewalDate: '2025-10-05T00:00:00.000Z',
        notes: 'Weekly check-ins.',
      },
    ],
    shots: [
      {
        id: 'shot_lucas_1',
        date: '2025-09-28T08:55:00.000Z',
        medication: 'Tirzepatide',
        doseValue: 4.5,
        doseUnit: 'mg',
        site: 'Left thigh',
        painLevel: 2,
        weightKg: 91.6,
        caloriesAvg: 2250,
        proteinAvgG: 100,
        notes: 'Minor soreness resolved next day.',
      },
    ],
    activities: [
      {
        id: 'act_lucas_1',
        kind: ActivityKind.INJECTION,
        title: 'Logged injection',
        subtitle: '4.5 mg Tirzepatide',
        occurredAt: '2025-10-22T08:50:00.000Z',
      },
      {
        id: 'act_lucas_2',
        kind: ActivityKind.WEIGHT,
        title: 'Logged weight',
        subtitle: '202 lbs',
        occurredAt: '2025-10-20T08:35:00.000Z',
      },
      {
        id: 'act_lucas_3',
        kind: ActivityKind.WORKOUT,
        title: 'Strength training',
        subtitle: 'Full-body session',
        occurredAt: '2025-10-18T19:00:00.000Z',
      },
      {
        id: 'act_lucas_4',
        kind: ActivityKind.MESSAGE,
        title: 'Coach feedback',
        subtitle: 'Keep tracking water intake',
        occurredAt: '2025-10-17T09:10:00.000Z',
      },
    ],
  },
];

async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16,
    timeCost: 4,
    parallelism: 2,
  });
}

async function resetDatabase() {
  await prisma.$transaction([
    prisma.userShot.deleteMany(),
    prisma.userActivity.deleteMany(),
    prisma.record.deleteMany(),
    prisma.userSnapshot.deleteMany(),
    prisma.userShipping.deleteMany(),
    prisma.refreshSession.deleteMany(),
    prisma.passwordResetToken.deleteMany(),
    prisma.emailVerificationToken.deleteMany(),
    prisma.auditLog.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

async function seedAdmin(adminEmail: string, adminPassword: string) {
  const passwordHash = await hashPassword(adminPassword);

  await prisma.user.create({
    data: {
      email: adminEmail.toLowerCase(),
      passwordHash,
      role: Role.ADMIN,
      firstName: 'System',
      lastName: 'Administrator',
      isEmailVerified: true,
      avatarUrl: 'https://i.pravatar.cc/150?img=11',
      shipping: {
        create: {
          fullName: 'System Administrator',
          address1: '1 Admin Plaza',
          city: 'Remote City',
          state: 'RC',
          postalCode: '00000',
          country: 'USA',
          phone: '+1 (555) 010-9999',
        },
      },
      snapshot: {
        create: {
          currentWeightLbs: 0,
          goalWeightLbs: 0,
          medicationType: 'N/A',
        },
      },
    },
  });
}

async function seedPatients() {
  const credentials: Array<{ email: string; password: string }> = [];

  for (const patient of patientSeeds) {
    const passwordHash = await hashPassword(DEFAULT_PASSWORD);

    await prisma.user.create({
      data: {
        email: patient.profile.email.toLowerCase(),
        passwordHash,
        role: Role.PATIENT,
        firstName: patient.profile.firstName,
        lastName: patient.profile.lastName,
        phone: patient.profile.phone,
        avatarUrl: patient.profile.avatarUrl,
        isEmailVerified: true,
        shipping: {
          create: {
            fullName: patient.shipping.fullName,
            address1: patient.shipping.address1,
            address2: patient.shipping.address2 ?? null,
            city: patient.shipping.city,
            state: patient.shipping.state,
            postalCode: patient.shipping.postalCode,
            country: patient.shipping.country,
            phone: patient.shipping.phone,
          },
        },
        snapshot: {
          create: {
            currentWeightLbs: patient.snapshot.currentWeightLbs,
            goalWeightLbs: patient.snapshot.goalWeightLbs,
            medicationType: patient.snapshot.medicationType,
            doseName: patient.snapshot.dose.name,
            doseValue: patient.snapshot.dose.value,
            doseUnit: patient.snapshot.dose.unit,
            nextAppointmentId: patient.snapshot.nextAppointment.id,
            nextAppointmentStartsAt: new Date(
              patient.snapshot.nextAppointment.startsAt,
            ),
          },
        },
        records: {
          create: patient.records.map((record) => ({
            id: randomUUID(),
            medication: record.medication,
            medicationType: record.medicationType,
            startDate: new Date(record.startDate),
            endDate: record.endDate ? new Date(record.endDate) : null,
            purchasedAt: new Date(record.purchasedAt),
            renewalDate: record.renewalDate
              ? new Date(record.renewalDate)
              : null,
            notes: record.notes,
          })),
        },
        shots: {
          create: patient.shots.map((shot) => ({
            id: randomUUID(),
            date: new Date(shot.date),
            medication: shot.medication,
            doseValue: shot.doseValue,
            doseUnit: shot.doseUnit,
            site: shot.site,
            painLevel: shot.painLevel,
            weightKg: shot.weightKg,
            caloriesAvg: shot.caloriesAvg,
            proteinAvgG: shot.proteinAvgG,
            notes: shot.notes,
          })),
        },
        activities: {
          create: patient.activities.map((activity) => ({
            id: randomUUID(),
            kind: activity.kind,
            title: activity.title,
            subtitle: activity.subtitle,
            occurredAt: new Date(activity.occurredAt),
          })),
        },
      },
    });

    credentials.push({
      email: patient.profile.email.toLowerCase(),
      password: DEFAULT_PASSWORD,
    });
  }

  return credentials;
}

async function main() {
  const adminEmail =
    process.env.SEED_ADMIN_EMAIL || 'admin@weightlossclinic.com';
  const adminPassword = DEFAULT_PASSWORD;

  console.log('Resetting database...');
  await resetDatabase();

  console.log('Seeding admin account...');
  await seedAdmin(adminEmail, adminPassword);

  console.log('Seeding patient accounts...');
  const patientCredentials = await seedPatients();

  console.log('\n✅ Seed complete');
  console.log(`Admin -> ${adminEmail} / ${adminPassword}`);
  console.log('\nPatient credentials:');
  patientCredentials.forEach((cred, index) => {
    console.log(
      `  ${index + 1}. ${cred.email} / ${cred.password}`,
    );
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
