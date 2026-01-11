import { randomUUID } from 'crypto';
import {
  ActivityKind,
  MedicationType,
  Prisma,
  PrismaClient,
  Role,
  ProductCategory,
} from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();
const DEFAULT_PASSWORD = '12345678';
const PLACEHOLDER_PRODUCT_IMAGE = 'https://placehold.co/800x600?text=Product';
const PLACEHOLDER_BENEFIT_IMAGE = 'https://placehold.co/400x400?text=Benefit';

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
  trackingNumber?: string | null;
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

type BlogSectionSeed = {
  id: string;
  title: string;
  content: string;
};

type BlogSeed = {
  token: string;
  title: string;
  excerpt: string;
  category: string;
  imgSrc: string;
  body: BlogSectionSeed[];
};

type ProductPlanSeed = {
  id: string;
  title: string;
  price: number;
  oldPrice?: number;
  href: string;
};

type ProductFaqSeed = {
  title: string;
  description: string;
};

type ProductWhyChooseSeed = {
  title: string;
  excerpt: string;
  imgSrc?: string;
};

type ProductHowItWorksSeed = {
  step: number;
  title: string;
  description: string;
};

type ProductImageSeed = {
  id?: string;
  bucket?: string;
  objectKey?: string;
  altText?: string;
  fallbackUrl?: string;
  variant?: string;
};

type WeightLossProductSeed = {
  token: string;
  category: ProductCategory;
  href: string;
  hrefForm?: string;
  name: string;
  oldPrice?: number;
  price: number;
  popular?: boolean;
  inStock?: boolean;
  badge?: string;
  description?: string;
  features?: string[];
  shipping?: string;
  instructions?: string;
  sideEffects?: string;
  whyChoose?: ProductWhyChooseSeed[];
  plan?: ProductPlanSeed[];
  question?: ProductFaqSeed[];
  howItWorks?: ProductHowItWorksSeed[];
  images?: ProductImageSeed[];
  metadata?: Record<string, unknown>;
};

type ProductSeedPayload = Omit<Prisma.WeightLossProductCreateInput, 'token'>;

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
  /** Optional override for how many synthetic records to create per patient. */
  recordSeriesCount?: number;
  /** Skip auto-adjusting the most recent records to fall within renewal reminder windows. */
  skipRecordAdjustments?: boolean;
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
  {
    profile: {
      firstName: 'Nora',
      lastName: 'Walsh',
      email: 'nora.walsh@example.com',
      phone: '+1 (555) 010-2010',
      avatarUrl: 'https://i.pravatar.cc/150?img=11',
    },    shipping: {
      fullName: 'Nora Walsh',
      address1: '741 Cedar Street',
      city: 'Portland',
      state: 'OR',
      postalCode: '97205',
      country: 'USA',
      phone: '+1 (555) 010-2010',
    },
    snapshot: {
      currentWeightLbs: 188,
      goalWeightLbs: 165,
      medicationType: 'Lifestyle',
      dose: { name: 'Wellness plan', value: 0, unit: 'unit' },
      nextAppointment: {
        id: 'apt_nora_2026_01_10',
        startsAt: '2026-01-10T15:00:00.000Z',
      },
    },
    records: [],
    shots: [],
    activities: [],
  },
  {
    profile: {
      firstName: 'Omar',
      lastName: 'Singh',
      email: 'omar.singh@example.com',
      phone: '+1 (555) 010-2011',
      avatarUrl: 'https://i.pravatar.cc/150?img=12',
    },    shipping: {
      fullName: 'Omar Singh',
      address1: '52 Meadowbrook Rd',
      city: 'Dallas',
      state: 'TX',
      postalCode: '75201',
      country: 'USA',
      phone: '+1 (555) 010-2011',
    },
    snapshot: {
      currentWeightLbs: 205,
      goalWeightLbs: 180,
      medicationType: 'Semaglutide',
      dose: { name: 'Semaglutide', value: 0.5, unit: 'mg' },
      nextAppointment: {
        id: 'apt_omar_2026_02_15',
        startsAt: '2026-02-15T18:30:00.000Z',
      },
    },
    records: [
      {
        id: 'rec_omar_1',
        medication: 'Semaglutide',
        medicationType: MedicationType.INJECTABLE,
        startDate: '2025-03-01T00:00:00.000Z',
        endDate: '2025-05-01T00:00:00.000Z',
        purchasedAt: '2025-03-01T10:00:00.000Z',
        renewalDate: '2025-05-01T00:00:00.000Z',
        notes: 'Completed plan before relocating out of state.',
      },
    ],
    shots: [],
    activities: [],
    recordSeriesCount: 1,
    skipRecordAdjustments: true,
  },
];

const blogSeeds: BlogSeed[] = [
  {
    token: 'sexual-health-naturally',
    title: 'Enhancing Sexual Health Naturally',
    excerpt:
      'Expert tips to improve intimacy, performance, and relationship wellness.',
    category: 'Sexual Health',
    imgSrc: '/images/landing/blog1.png',
    body: [
      {
        id: 'understanding-intimacy',
        title: 'Understanding Intimacy and Sexual Health',
        content:
          '<p>Sexual health is a cornerstone of overall wellness. At Joey Med, we know that issues around intimacy can impact confidence, relationships, and emotional health. Our telehealth platform allows patients to discuss concerns privately and receive tailored care without stigma or judgment.</p><p>Sexual wellness goes beyond performance — it includes mental health, emotional connection, and lifestyle choices. By addressing these together, we help patients rediscover confidence and improve their quality of life.</p>',
      },
      {
        id: 'natural-approaches',
        title: 'Natural Approaches to Improving Sexual Wellness',
        content:
          '<p>While medical treatments can play an important role, many patients see improvement with natural adjustments to daily habits. Diet, exercise, stress management, and sleep patterns all influence sexual performance and satisfaction.</p><ul><li>Balanced nutrition to support hormones</li><li>Regular exercise to improve circulation</li><li>Mindfulness practices to reduce anxiety</li><li>Adequate sleep for recovery and energy</li></ul>',
      },
      {
        id: 'telehealth-solutions',
        title: 'How Telehealth Supports Sexual Health',
        content:
          '<p>Joey Med provides discreet, professional care through virtual consultations. Our providers specialize in conditions like erectile dysfunction, low libido, and hormone imbalances. Through HIPAA-compliant systems, patients can access care from home and receive medications shipped directly to their door.</p>',
      },
      {
        id: 'ongoing-support',
        title: 'Ongoing Support for Lasting Confidence',
        content:
          '<p>Sexual health is not a one-time issue — it requires ongoing support. Joey Med ensures patients have follow-ups, prescription adjustments, and continuous access to expert advice. Our goal is to build lasting confidence and intimacy for every patient.</p>',
      },
    ],
  },
];

const productSeeds: WeightLossProductSeed[] = [
  {
    token: 'glp1-core-plan',
    category: ProductCategory.WEIGHT_LOSS,
    href: '/weight-loss/glp1-core-plan',
    hrefForm: 'wLinkForm',
    name: 'GLP-1 Core — Injection',
    oldPrice: 279,
    price: 199,
    popular: true,
    inStock: true,
    badge: 'Clinician-guided GLP-1 program (Semuglatide)',
    description:
      'A GLP-1 core plan (Semuglatide) designed to support steady weight loss, appetite control, and metabolic balance with weekly injections.',
    features: [
      'GLP-1 support with weekly dosing',
      'Focus on appetite and satiety',
      'Provider-guided titration schedule',
    ],
    shipping: 'Ships in 1–2 days — Free delivery over $40',
    instructions:
      'Inject once weekly as directed by your provider. Follow the titration schedule and do not exceed the prescribed dose.',
    sideEffects:
      'Possible nausea, GI upset, or headache. Effects are usually mild and temporary. Contact your provider if severe.',
    whyChoose: [
      {
        title: 'Clinician-guided',
        excerpt: 'Structured plan with check-ins',
        imgSrc: '/images/weight-loss/products/1.jpg',
      },
      {
        title: 'Appetite control',
        excerpt: 'Helps reduce cravings',
        imgSrc: '/images/weight-loss/products/2.jpg',
      },
      {
        title: 'Steady progress',
        excerpt: 'Built for sustainable loss',
        imgSrc: '/images/weight-loss/products/3.jpg',
      },
    ],
    plan: [
      {
        id: '1',
        title: '4 Week',
        price: 199,
        oldPrice: 279,
        href: 'https://pay.joeymed.com/b/fZueV6cY7eXLfJee337wA0n',
      },
      {
        id: '2',
        title: '8 Weeks',
        price: 299,
        oldPrice: 440,
        href: 'https://pay.joeymed.com/b/dRmeV68HRcPDbsY0cd7wA0t',
      },
      {
        id: '3',
        title: '12 Week Elite',
        price: 399,
        oldPrice: 599,
        href: 'https://pay.joeymed.com/b/9B69AM5vFcPD0Ok9MN7wA0u',
      },
    ],
    question: [
      {
        title: 'What is this plan?',
        description:
          'A weekly GLP-1 program designed to support steady weight loss with provider oversight and lifestyle guidance.',
      },
      {
        title: 'How do I use it?',
        description:
          'Inject once per week as instructed. Stay consistent with your dosing day and follow your nutrition plan.',
      },
      {
        title: 'Side effects?',
        description:
          'Mild nausea or GI upset can occur and often fades. Seek help if symptoms are severe or persistent.',
      },
    ],
    howItWorks: [
      {
        step: 1,
        title: 'Start weekly dosing',
        description:
          'Begin with a starter dose and follow your titration plan.',
      },
      {
        step: 2,
        title: 'Support habits',
        description: 'Pair with nutrition, hydration, and daily movement.',
      },
      {
        step: 3,
        title: 'Track results',
        description:
          'Review progress with your provider and adjust as needed.',
      },
    ],
    images: [
      {
        id: 'glp1-core-plan-hero',
        bucket: 'weight-loss-media',
        objectKey: 'weight-loss/products/glp1-core/hero.png',
        altText: 'GLP-1 Core hero art',
        fallbackUrl: '/images/weight-loss/products/GLP-1 Core.png',
        variant: 'hero',
      },
      {
        id: 'glp1-core-plan-alt-1',
        bucket: 'weight-loss-media',
        objectKey: 'weight-loss/products/glp1-core/detail-1.png',
        altText: 'GLP-1 Core detail 1',
        fallbackUrl: '/images/weight-loss/products/GLP-1 Core.png',
        variant: 'detail',
      },
      {
        id: 'glp1-core-plan-alt-2',
        bucket: 'weight-loss-media',
        objectKey: 'weight-loss/products/glp1-core/detail-2.png',
        altText: 'GLP-1 Core detail 2',
        fallbackUrl: '/images/weight-loss/products/GLP-1 Core.png',
        variant: 'detail',
      },
    ],
    metadata: {
      category: 'glp-1',
      displayOrder: 1,
    },
  },
  {
    token: 'glp1-plus-core-plan',
    category: ProductCategory.WEIGHT_LOSS,
    href: '/weight-loss/glp1-plus-core-plan',
    hrefForm: 'wLinkForm',
    name: 'GLP-1 Plus Core — Injection',
    oldPrice: 399,
    price: 279,
    popular: false,
    inStock: true,
    badge: 'Enhanced guidance & follow-ups (Tirzepatide)',
    description:
      'An enhanced GLP-1 (Tirzepatide) plan with weekly injections, added provider follow-ups, and lifestyle coaching support for stronger adherence.',
    features: [
      'Weekly GLP-1 injections',
      'Extra provider follow-ups',
      'Lifestyle & adherence support',
    ],
    shipping: 'Ships in 1–2 days — Free delivery over $40',
    instructions:
      'Inject weekly on a consistent day. Attend scheduled check-ins and follow your titration & nutrition plan.',
    sideEffects:
      'Potential nausea, stomach upset, or headache. Typically transient; contact your provider if persistent or severe.',
    whyChoose: [
      {
        title: 'More support',
        excerpt: 'Added check-ins for accountability',
        imgSrc: '/images/weight-loss/products/1.jpg',
      },
      {
        title: 'Personalized tweaks',
        excerpt: 'Dosing adjusted to your response',
        imgSrc: '/images/weight-loss/products/2.jpg',
      },
      {
        title: 'Clear roadmap',
        excerpt: 'Structured plan to stay on track',
        imgSrc: '/images/weight-loss/products/3.jpg',
      },
    ],
    plan: [
      {
        id: '5',
        title: '4 Weeks',
        price: 279,
        oldPrice: 379,
        href: 'https://pay.joeymed.com/b/eVq6oA9LVeXL68E1gh7wA0p',
      },
      {
        id: '6',
        title: '8 Weeks',
        price: 399,
        oldPrice: 458,
        href: 'https://pay.joeymed.com/b/aFa6oA6zJ8zn2Ws4st7wA0v',
      },
      {
        id: '7',
        title: '12 Week Elite',
        price: 499,
        oldPrice: 589,
        href: 'https://pay.joeymed.com/b/aFacMYbU36rf68E5wx7wA0A',
      },
    ],
    question: [
      {
        title: 'What’s different vs Core?',
        description:
          'You’ll receive more frequent provider follow-ups and added coaching support to help maintain momentum.',
      },
      {
        title: 'How do I get started?',
        description:
          'Complete your intake, get approved, and begin weekly injections with an adherence plan and check-ins.',
      },
      {
        title: 'Any diet rules?',
        description:
          'Focus on protein, hydration, and fiber-rich foods. Your provider may share a simple weekly nutrition target.',
      },
    ],
    howItWorks: [
      {
        step: 1,
        title: 'Intake & approval',
        description: 'Complete intake and provider review.',
      },
      {
        step: 2,
        title: 'Weekly dosing',
        description: 'Follow your injection + titration schedule.',
      },
      {
        step: 3,
        title: 'Check-ins',
        description: 'Use follow-ups to fine-tune and stay consistent.',
      },
    ],
    images: [
      {
        id: 'glp1-plus-core-hero',
        bucket: 'weight-loss-media',
        objectKey: 'weight-loss/products/glp1-plus-core/hero.png',
        altText: 'GLP-1 Plus Core hero art',
        fallbackUrl: '/images/weight-loss/products/GLP-1 Plus Core.png',
        variant: 'hero',
      },
      {
        id: 'glp1-plus-core-alt-1',
        bucket: 'weight-loss-media',
        objectKey: 'weight-loss/products/glp1-plus-core/detail-1.png',
        altText: 'GLP-1 Plus Core detail 1',
        fallbackUrl: '/images/weight-loss/products/GLP-1 Plus Core.png',
        variant: 'detail',
      },
    ],
    metadata: {
      category: 'glp-1',
      displayOrder: 2,
    },
  },
  {
    token: 'lipo-mic-ultraburn',
    category: ProductCategory.WEIGHT_LOSS,
    href: '/weight-loss/lipo-mic-ultraburn',
    hrefForm: 'wLinkForm',
    name: 'Lipo MIC UltraBurn — Injection',
    oldPrice: 199,
    price: 89,
    popular: false,
    inStock: true,
    badge: 'Metabolism & energy support',
    description:
      'A Lipo MIC blend to support fat metabolism and energy alongside your nutrition and movement plan, This is a Lipo MIC.',
    features: [
      'Lipo MIC (lipotropics) blend',
      'Supports fat metabolism & energy',
      'Provider-guided schedule',
    ],
    shipping: 'Ships in 1–2 days — Free delivery over $40',
    instructions:
      'Use as directed by your provider. Follow the recommended schedule and pair with diet and activity guidance.',
    sideEffects:
      'Generally well-tolerated; mild injection-site discomfort possible. Contact your provider if you experience unusual symptoms.',
    whyChoose: [
      {
        title: 'Metabolic nudge',
        excerpt: 'Designed to complement weight efforts',
        imgSrc: '/images/weight-loss/products/1.jpg',
      },
      {
        title: 'Convenient cadence',
        excerpt: 'Simple provider-guided schedule',
        imgSrc: '/images/weight-loss/products/2.jpg',
      },
      {
        title: 'Pairs with GLP-1',
        excerpt: 'Use alongside diet & movement',
        imgSrc: '/images/weight-loss/products/3.jpg',
      },
    ],
    plan: [
      {
        id: '5',
        title: '4 Weeks',
        price: 60,
        oldPrice: 120,
        href: 'https://pay.joeymed.com/b/4gM7sEaPZg1P40waQR7wA0w',
      },
      {
        id: '6',
        title: '8 Weeks',
        price: 100,
        oldPrice: 160,
        href: 'https://pay.joeymed.com/b/28E28kf6fbLz68Egbb7wA0x',
      },
      {
        id: '7',
        title: '12 Week Elite',
        price: 120,
        oldPrice: 200,
        href: 'https://pay.joeymed.com/b/00w5kw3nxcPD9kQ1gh7wA0y',
      },
    ],
    question: [
      {
        title: 'What is Lipo MIC?',
        description:
          'A combination of lipotropic compounds used to support fat metabolism and energy as part of a broader plan.',
      },
      {
        title: 'How is it used?',
        description:
          'Administer on the schedule provided by your clinician. Keep consistent nutrition, hydration, and activity.',
      },
      {
        title: 'Can I combine with GLP-1?',
        description:
          'Often used alongside lifestyle and other therapies. Always follow your provider’s guidance.',
      },
    ],
    howItWorks: [
      {
        step: 1,
        title: 'Provider plan',
        description: 'Confirm your dosing cadence and goals.',
      },
      {
        step: 2,
        title: 'Stay consistent',
        description: 'Follow the schedule and log how you feel.',
      },
      {
        step: 3,
        title: 'Review & adjust',
        description: 'Share progress; your plan can be refined.',
      },
    ],
    images: [
      {
        id: 'lipo-ultraburn-hero',
        bucket: 'weight-loss-media',
        objectKey: 'weight-loss/products/lipo-mic-ultraburn/hero.png',
        altText: 'Lipo MIC UltraBurn hero art',
        fallbackUrl: '/images/weight-loss/products/Lipo MIC Ultraburn.png',
        variant: 'hero',
      },
    ],
    metadata: {
      category: 'mic',
      displayOrder: 3,
    },
  },
  {
    token: 'womens-vitality-pt-141-blend',
    category: ProductCategory.SEXUAL_HEALTH,
    href: '/sexual-health/womens-vitality-pt-141-blend',
    hrefForm: 'sLinkForm',
    name: 'Joey Med Women’s Vitality (PT-141 Blend) — RDT/SL Tab',
    oldPrice: 169,
    price: 129,
    popular: true,
    inStock: true,
    badge: 'Fast-acting, sublingual convenience',
    description:
      'A PT-141–based rapid-dissolve/sublingual blend designed to support female libido and intimacy.',
    features: [
      'Sublingual format for quicker onset',
      'Targets desire and arousal pathways',
      'Clinically used peptide base (PT-141) with supportive actives',
    ],
    shipping: 'Ships in 1–2 days - Free delivery over $40',
    instructions:
      'Place one tablet under the tongue and allow it to dissolve as directed by your provider. Do not exceed the prescribed dose.',
    sideEffects:
      'May include nausea, flushing, or headache. These effects are typically mild and temporary. Seek help if symptoms are severe or persistent.',
    whyChoose: [
      { title: 'Targeted support', excerpt: 'Formulated to enhance desire and arousal' },
      { title: 'Fast onset', excerpt: 'Sublingual route for speed and convenience' },
      { title: 'Discreet use', excerpt: 'Small, easy-to-take tabs' },
    ],
    plan: [
      { id: 'sv-1', title: 'Single Pack', price: 129, oldPrice: 169, href: '#' },
    ],
    question: [
      { title: 'What is this blend?', description: 'A compounded PT-141–based formula designed to support women’s libido and intimacy.' },
      { title: 'How do I take it?', description: 'Let one RDT/SL tab dissolve under the tongue as directed by your provider.' },
      { title: 'What are the side effects?', description: 'Possible nausea, flushing, or headache. Contact your provider if severe.' },
    ],
    howItWorks: [
      { step: 1, title: 'Dissolve under tongue', description: 'Use as prescribed for best results.' },
      { step: 2, title: 'Allow absorption', description: 'Sublingual route helps faster uptake.' },
      { step: 3, title: 'Feel the support', description: 'Designed to enhance desire and intimacy.' },
    ],
    images: [{ fallbackUrl: PLACEHOLDER_PRODUCT_IMAGE }],
    metadata: { displayOrder: 1 },
  },
  {
    token: 'mens-vitality-performance-blend',
    category: ProductCategory.SEXUAL_HEALTH,
    href: '/sexual-health/mens-vitality-performance-blend',
    hrefForm: 'sLinkForm',
    name: 'Joey Med Men’s Vitality (Performance Blend) — Troche/SL',
    oldPrice: 169,
    price: 129,
    popular: true,
    inStock: true,
    badge: 'Formulated for performance & confidence',
    description:
      'A compounded performance blend in troche/SL format to support sexual performance and stamina.',
    features: [
      'Troche/sublingual format',
      'Supports blood flow and performance',
      'Provider-guided dosing',
    ],
    shipping: 'Ships in 1–2 days - Free delivery over $40',
    instructions:
      'Place one troche/SL tab under the tongue and allow it to dissolve. Follow your provider’s dosing schedule.',
    sideEffects:
      'May include flushing, headache, or mild dizziness. Seek help if symptoms are severe or persistent.',
    whyChoose: [
      { title: 'Performance support', excerpt: 'Helps you feel confident and ready' },
      { title: 'Sublingual delivery', excerpt: 'Convenient and fast-acting route' },
      { title: 'Provider-guided', excerpt: 'Personalized plan for your goals' },
    ],
    plan: [{ id: 'mv-1', title: 'Single Pack', price: 129, oldPrice: 169, href: '#' }],
    question: [
      { title: 'What is this blend?', description: 'A compounded troche/SL formulation designed to support male performance and stamina.' },
      { title: 'How do I take it?', description: 'Dissolve one troche/SL tab under the tongue as your provider directs.' },
      { title: 'Side effects?', description: 'Flushing or headache can occur. Contact your provider if severe.' },
    ],
    howItWorks: [
      { step: 1, title: 'Use sublingually', description: 'Let the troche dissolve fully.' },
      { step: 2, title: 'Support performance', description: 'Formulated to back stamina and readiness.' },
      { step: 3, title: 'Stay consistent', description: 'Follow your plan for best results.' },
    ],
    images: [{ fallbackUrl: PLACEHOLDER_PRODUCT_IMAGE }],
    metadata: { displayOrder: 2 },
  },
  {
    token: 'oxytocin-nasal-spray',
    category: ProductCategory.SEXUAL_HEALTH,
    href: '/sexual-health/oxytocin-nasal-spray',
    hrefForm: 'sLinkForm',
    name: 'Oxytocin Nasal Spray (Mood & Intimacy) — Nasal Spray',
    oldPrice: 129,
    price: 89,
    popular: false,
    inStock: true,
    badge: 'Compounded nasal formulation',
    description:
      'A compounded oxytocin nasal spray designed to support mood, bonding, and intimacy.',
    features: [
      'Easy nasal administration',
      'Supports mood & connection',
      'Provider-guided use',
    ],
    shipping: 'Ships in 1–2 days - Free delivery over $40',
    instructions:
      'Use as directed by your provider. Prime the pump if needed. Avoid sharing devices.',
    sideEffects:
      'May include nasal irritation or headache. Stop use and contact your provider if severe.',
    whyChoose: [
      { title: 'Mood & intimacy', excerpt: 'Supports bonding pathways' },
      { title: 'Simple dosing', excerpt: 'Quick nasal administration' },
      { title: 'Discreet', excerpt: 'Portable spray device' },
    ],
    plan: [{ id: 'oxy-1', title: 'Single Bottle', price: 89, oldPrice: 129, href: '#' }],
    question: [
      { title: 'What is oxytocin?', description: 'A peptide associated with social bonding; this compounded spray is designed to support mood and intimacy.' },
      { title: 'How do I use it?', description: 'Follow your provider’s instructions for number of sprays and timing.' },
      { title: 'Side effects?', description: 'May include nasal irritation or headache. Seek help if severe.' },
    ],
    howItWorks: [
      { step: 1, title: 'Prime & spray', description: 'Use intranasally as directed.' },
      { step: 2, title: 'Support bonding', description: 'Targets pathways linked to intimacy.' },
      { step: 3, title: 'Use consistently', description: 'Follow your plan for best results.' },
    ],
    images: [{ fallbackUrl: PLACEHOLDER_PRODUCT_IMAGE }],
    metadata: { displayOrder: 3 },
  },
  {
    token: 'pt-141-nasal-spray',
    category: ProductCategory.SEXUAL_HEALTH,
    href: '/sexual-health/pt-141-nasal-spray',
    hrefForm: 'sLinkForm',
    name: 'PT-141 Nasal Spray (Libido & Arousal) — Nasal Spray',
    oldPrice: 199,
    price: 149,
    popular: true,
    inStock: true,
    badge: 'Popular peptide-based option',
    description:
      'A compounded PT-141 nasal spray designed to support libido and arousal in men and women.',
    features: [
      'Targets desire and arousal',
      'Nasal route for convenience',
      'Provider-customized plan',
    ],
    shipping: 'Ships in 1–2 days - Free delivery over $40',
    instructions:
      'Use the prescribed number of sprays as directed by your provider. Do not exceed the recommended dose.',
    sideEffects:
      'May include flushing, nausea, or headache. Stop use and contact your provider if severe.',
    whyChoose: [
      { title: 'Libido support', excerpt: 'Designed to enhance desire' },
      { title: 'Convenient', excerpt: 'Easy-to-use nasal device' },
      { title: 'Personalized', excerpt: 'Provider-guided titration' },
    ],
    plan: [{ id: 'pt141-1', title: 'Single Bottle', price: 149, oldPrice: 199, href: '#' }],
    question: [
      { title: 'What is PT-141?', description: 'A peptide used in compounded therapies that can support libido and arousal.' },
      { title: 'How do I use it?', description: 'Use intranasally per your provider’s instructions for timing and dose.' },
      { title: 'Side effects?', description: 'Possible flushing, nausea, or headache. Contact your provider if severe.' },
    ],
    howItWorks: [
      { step: 1, title: 'Spray intranasally', description: 'Follow the prescribed regimen.' },
      { step: 2, title: 'Support arousal', description: 'Targets central pathways for desire.' },
      { step: 3, title: 'Assess & adjust', description: 'Your provider may tailor the plan.' },
    ],
    images: [{ fallbackUrl: PLACEHOLDER_PRODUCT_IMAGE }],
    metadata: { displayOrder: 4 },
  },
  {
    token: 'sildenafil-100mg',
    category: ProductCategory.SEXUAL_HEALTH,
    href: '/sexual-health/sildenafil-100mg',
    hrefForm: 'sLinkForm',
    name: 'Sildenafil 100mg (ED Relief) — Tablet',
    oldPrice: 89,
    price: 59,
    popular: true,
    inStock: true,
    badge: 'Used and trusted by 200,000 people',
    description:
      'A proven ED treatment that helps you achieve and maintain stronger erections when you need them.',
    features: [
      'Clinically proven ED relief',
      'Typical onset within 30–60 minutes',
      'On-demand dosing',
    ],
    shipping: 'Ships in 1–2 days - Free delivery over $40',
    instructions:
      'Take one tablet with water about 30–60 minutes before sexual activity. Do not exceed one dose in 24 hours.',
    sideEffects:
      'Common side effects may include headache, flushing, or nasal congestion. Seek help if severe or persistent.',
    whyChoose: [
      { title: 'Effective relief', excerpt: 'Helps achieve and maintain erections' },
      { title: 'On-demand', excerpt: 'Use only when needed' },
      { title: 'Provider-guided', excerpt: 'Personalized guidance for safety' },
    ],
    plan: [{ id: 'sil-1', title: '10 Tablets', price: 59, oldPrice: 89, href: '#' }],
    question: [
      { title: 'What is Sildenafil?', description: 'A PDE5 inhibitor used to treat erectile dysfunction by improving blood flow.' },
      { title: 'How do I take it?', description: 'Take one tablet 30–60 minutes before activity with water. Avoid high-fat meals around dosing.' },
      { title: 'Side effects?', description: 'Headache, flushing, or congestion can occur; contact your provider if severe.' },
    ],
    howItWorks: [
      { step: 1, title: 'Take as needed', description: 'Dose before planned activity.' },
      { step: 2, title: 'Get aroused', description: 'Requires sexual stimulation to work.' },
      { step: 3, title: 'Enjoy support', description: 'Improved blood flow aids performance.' },
    ],
    images: [{ fallbackUrl: PLACEHOLDER_PRODUCT_IMAGE }],
    metadata: { displayOrder: 5 },
  },
  {
    token: 'tadalafil-20mg',
    category: ProductCategory.SEXUAL_HEALTH,
    href: '/sexual-health/tadalafil-20mg',
    hrefForm: 'sLinkForm',
    name: 'Tadalafil 20mg (ED Relief) — Tablet',
    oldPrice: 88,
    price: 58,
    popular: true,
    inStock: true,
    badge: 'Used and trusted by 200,000 people',
    description:
      'Effectively, daily-use ED treatment that helps you stay ready — whenever the moment is right.',
    features: [
      'Clinically proven to treat ED effectively',
      'Stays active in your system for up to 36 hours',
      'Starts working in as little as 30 minutes',
    ],
    shipping: 'Ships in 1–2 days - Free delivery over $40',
    instructions:
      'Take one tablet with water about 30 minutes before sexual activity. Do not take more than one dose in 24 hours.',
    sideEffects:
      'Common side effects may include headache, indigestion, flushing, or muscle aches. Seek help if severe or persistent.',
    whyChoose: [
      { title: 'Faster-acting', excerpt: 'Starts working in as little as 30 minutes' },
      { title: 'Bigger, harder erections', excerpt: 'Improves blood flow where it matters' },
      { title: 'Longer-lasting', excerpt: 'Stays effective for up to 36 hours' },
    ],
    plan: [{ id: 'tad20-1', title: '10 Tablets', price: 58, oldPrice: 88, href: '#' }],
    question: [
      { title: 'What are Tadalafil?', description: 'Tadalafil is a long-acting ED medication that helps you to achieve and maintain stronger erections.' },
      { title: 'How do I take it?', description: 'Take one tablet with water about 30 minutes before sexual activity. Do not take more than one dose in 24 hours.' },
      { title: 'What are the side effects?', description: 'Common effects may include headache, indigestion, flushing, or muscle aches.' },
    ],
    howItWorks: [
      { step: 1, title: 'Take the tablet', description: 'Swallow one pill with water 30–60 minutes before activity.' },
      { step: 2, title: 'Get aroused', description: 'Works with sexual stimulation.' },
      { step: 3, title: 'Enjoy the results', description: 'Support that can last up to 36 hours.' },
    ],
    images: [{ fallbackUrl: PLACEHOLDER_PRODUCT_IMAGE }],
    metadata: { displayOrder: 6 },
  },
  {
    token: 'tadalafil-5mg-daily',
    category: ProductCategory.SEXUAL_HEALTH,
    href: '/sexual-health/tadalafil-5mg-daily',
    hrefForm: 'sLinkForm',
    name: 'Tadalafil 5mg Daily (Continuous Support) — Tablet',
    oldPrice: 99,
    price: 69,
    popular: false,
    inStock: true,
    badge: 'Once-daily, steady support',
    description:
      'A lower-dose, once-daily tadalafil regimen designed for continuous ED support and spontaneity.',
    features: [
      'Steady-state coverage',
      'Supports spontaneity',
      'Low daily dose',
    ],
    shipping: 'Ships in 1–2 days - Free delivery over $40',
    instructions:
      'Take one tablet daily at the same time, with or without food, as directed by your provider.',
    sideEffects:
      'May include headache, indigestion, or back/muscle aches. Contact your provider if severe.',
    whyChoose: [
      { title: 'Daily readiness', excerpt: 'Support without timing doses' },
      { title: 'Low-dose plan', excerpt: 'Designed for tolerability' },
      { title: 'Provider-guided', excerpt: 'Monitor and adjust as needed' },
    ],
    plan: [{ id: 'tad5-1', title: '30 Tablets', price: 69, oldPrice: 99, href: '#' }],
    question: [
      { title: 'What is daily tadalafil?', description: 'A once-daily low dose aiming for continuous ED support.' },
      { title: 'How do I take it?', description: 'Take at the same time each day as directed by your provider.' },
      { title: 'Side effects?', description: 'Headache or indigestion can occur. Contact your provider if severe.' },
    ],
    howItWorks: [
      { step: 1, title: 'Take daily', description: 'Builds steady support over time.' },
      { step: 2, title: 'Stay ready', description: 'No need to time single doses.' },
      { step: 3, title: 'Review plan', description: 'Follow up with your provider as needed.' },
    ],
    images: [{ fallbackUrl: PLACEHOLDER_PRODUCT_IMAGE }],
    metadata: { displayOrder: 7 },
  },
  {
    token: 'vitalitymax-tadalafil-sildenafil-oxytocin',
    category: ProductCategory.SEXUAL_HEALTH,
    href: '/sexual-health/vitalitymax-tadalafil-sildenafil-oxytocin',
    hrefForm: 'sLinkForm',
    name: 'VitalityMax (Tadalafil + Sildenafil + Oxytocin) — Troche/SL Tab',
    oldPrice: 229,
    price: 179,
    popular: true,
    inStock: true,
    badge: 'Triple-action, provider-guided blend',
    description:
      'A compounded troche/SL combination of tadalafil, sildenafil, and oxytocin.',
    features: [
      'Multi-pathway support',
      'Troche/sublingual format',
      'Personalized plan',
    ],
    shipping: 'Ships in 1–2 days - Free delivery over $40',
    instructions:
      'Dissolve one troche under the tongue per your provider’s guidance. Do not exceed recommended dosing.',
    sideEffects:
      'May include flushing, headache, or nausea. Stop use and contact your provider if severe.',
    whyChoose: [
      { title: 'Comprehensive support', excerpt: 'Targets performance and intimacy' },
      { title: 'Fast-acting route', excerpt: 'Sublingual administration' },
      { title: 'Provider oversight', excerpt: 'Tailored to your needs' },
    ],
    plan: [{ id: 'vita-1', title: 'Single Pack', price: 179, oldPrice: 229, href: '#' }],
    question: [
      { title: 'What is VitalityMax?', description: 'A compounded combination of tadalafil, sildenafil, and oxytocin in a sublingual troche.' },
      { title: 'How do I take it?', description: 'Dissolve under the tongue as your provider directs. Do not combine with nitrates.' },
      { title: 'Side effects?', description: 'Flushing or headache can occur. Contact your provider if severe.' },
    ],
    howItWorks: [
      { step: 1, title: 'Dissolve sublingually', description: 'Follow timing as prescribed.' },
      { step: 2, title: 'Multi-pathway action', description: 'Aims to support both performance and intimacy.' },
      { step: 3, title: 'Monitor response', description: 'Provider may adjust the plan for you.' },
    ],
    images: [{ fallbackUrl: PLACEHOLDER_PRODUCT_IMAGE }],
    metadata: { displayOrder: 8 },
  },
  {
    token: 'bliss-intimacy-cream',
    category: ProductCategory.SEXUAL_HEALTH,
    href: '/sexual-health/bliss-intimacy-cream',
    hrefForm: 'sLinkForm',
    name: 'BLISS Intimacy Cream (Topical Libido Support) — Cream',
    oldPrice: 99,
    price: 79,
    popular: false,
    inStock: true,
    badge: 'Topical, targeted support',
    description:
      'A topical compounded cream designed to support arousal and sensitivity during intimacy.',
    features: [
      'Topical/localized application',
      'Designed for sensitivity and arousal',
      'Discreet and easy to use',
    ],
    shipping: 'Ships in 1–2 days - Free delivery over $40',
    instructions:
      'Apply a small amount to the directed area prior to intimacy as instructed by your provider. Wash hands after use.',
    sideEffects:
      'May include local irritation or redness. Discontinue and contact your provider if severe.',
    whyChoose: [
      { title: 'Targeted', excerpt: 'Applies only where needed' },
      { title: 'Discreet', excerpt: 'Easy to integrate into routine' },
      { title: 'Compounded', excerpt: 'Made to provider specifications' },
    ],
    plan: [{ id: 'bliss-1', title: 'Single Tube', price: 79, oldPrice: 99, href: '#' }],
    question: [
      { title: 'What is BLISS?', description: 'A compounded topical cream intended to support sensitivity and arousal.' },
      { title: 'How do I use it?', description: 'Apply a thin layer as directed by your provider before intimacy.' },
      { title: 'Side effects?', description: 'Possible local irritation; discontinue if severe and contact your provider.' },
    ],
    howItWorks: [
      { step: 1, title: 'Apply topically', description: 'Use a small amount as directed.' },
      { step: 2, title: 'Allow absorption', description: 'Give it time to absorb before activity.' },
      { step: 3, title: 'Assess response', description: 'Adjust with your provider’s guidance.' },
    ],
    images: [{ fallbackUrl: PLACEHOLDER_PRODUCT_IMAGE }],
    metadata: { displayOrder: 9 },
  },
  {
    token: 'nad-plus-injection',
    category: ProductCategory.WELLNESS,
    href: '/wellness/nad-plus-injection',
    hrefForm: 'hLinkForm',
    name: 'NAD+ Injection (Cellular Repair & Vitality) — Injection',
    oldPrice: 199,
    price: 149,
    popular: true,
    inStock: true,
    badge: 'Includes 1 vial',
    description:
      'A NAD+ injection designed to support cellular repair, steady vitality, and balanced wellness with provider oversight.',
    features: [
      'Targets cellular repair pathways',
      'Supports sustained energy levels',
      'Includes 1 vial',
    ],
    shipping: 'Ships in 1–2 days — Free delivery over $40',
    instructions:
      'Inject as directed on your schedule. Rotate injection sites, follow aseptic technique, and never exceed the prescribed dose.',
    sideEffects:
      'May include local irritation, nausea, or headache. Contact your provider if symptoms are severe or persistent.',
    whyChoose: [
      { title: 'Cellular support', excerpt: 'Repair and vitality focus' },
      { title: 'Steady energy', excerpt: 'Backs daily performance' },
      { title: 'Guided plan', excerpt: 'Clear dosing structure' },
    ],
    plan: [{ id: 'nadinj-1', title: 'Single Vial', price: 149, oldPrice: 199, href: '#' }],
    question: [
      { title: 'What is this plan?', description: 'A clinician-guided NAD+ injection protocol designed to support cellular health and day-to-day vitality.' },
      { title: 'How do I use it?', description: 'Administer injections per schedule, rotate sites, and maintain hydration and nutrition.' },
      { title: 'Side effects?', description: 'Mild local irritation can occur. Seek help if symptoms escalate or persist.' },
    ],
    howItWorks: [
      { step: 1, title: 'Start dosing', description: 'Follow your scheduled injections.' },
      { step: 2, title: 'Back metabolism', description: 'NAD+ supports cellular pathways.' },
      { step: 3, title: 'Review & adjust', description: 'Provider fine-tunes as needed.' },
    ],
    images: [{ fallbackUrl: PLACEHOLDER_PRODUCT_IMAGE }],
    metadata: { displayOrder: 1 },
  },
  {
    token: 'nad-plus-nasal-spray',
    category: ProductCategory.WELLNESS,
    href: '/wellness/nad-plus-nasal-spray',
    hrefForm: 'hLinkForm',
    name: 'NAD+ Nasal Spray (Energy & Brain Health) — Nasal Spray',
    oldPrice: 169,
    price: 69,
    popular: true,
    inStock: true,
    badge: 'Includes 1 spray bottle',
    description:
      'A NAD+ nasal spray designed to support cellular energy, mental clarity, and healthy focus with easy daily use.',
    features: [
      'Targets cellular energy pathways',
      'Supports clarity and cognition',
      'Includes 1 spray bottle',
    ],
    shipping: 'Ships in 1–2 days — Free delivery over $40',
    instructions:
      'Use the directed number of sprays per nostril as prescribed. Prime the device if needed and avoid sharing applicators.',
    sideEffects:
      'May include mild nasal irritation or headache. Stop use and contact your provider if symptoms are severe or persistent.',
    whyChoose: [
      { title: 'Energy support', excerpt: 'Backed by NAD+ pathways' },
      { title: 'Brain health', excerpt: 'Clarity and focus support' },
      { title: 'Daily ease', excerpt: 'Quick, discreet dosing' },
    ],
    plan: [{ id: 'nadspray-1', title: 'Single Bottle', price: 69, oldPrice: 169, href: '#' }],
    question: [
      { title: 'What is this spray?', description: 'A compounded NAD+ nasal option designed to support energy and cognitive function in daily routines.' },
      { title: 'How do I use it?', description: 'Spray as prescribed and keep a consistent schedule. Avoid blowing your nose immediately after dosing.' },
      { title: 'Side effects?', description: 'Occasional nasal irritation or headache can occur. Seek help if symptoms persist or worsen.' },
    ],
    howItWorks: [
      { step: 1, title: 'Prime & spray', description: 'Administer intranasally per your plan.' },
      { step: 2, title: 'Support energy', description: 'NAD+ backs cellular metabolism.' },
      { step: 3, title: 'Stay consistent', description: 'Daily use reinforces benefits.' },
    ],
    images: [{ fallbackUrl: PLACEHOLDER_PRODUCT_IMAGE }],
    metadata: { displayOrder: 2 },
  },
  {
    token: 'sermorelin-peptide-therapy',
    category: ProductCategory.WELLNESS,
    href: '/wellness/sermorelin-peptide-therapy',
    hrefForm: 'hLinkForm',
    name: 'Sermorelin Peptide Therapy (GH Support & Sleep) — Injection',
    oldPrice: 229,
    price: 119,
    popular: false,
    inStock: true,
    badge: 'Includes 1 vial',
    description:
      'A sermorelin peptide plan designed to support GH signaling, restful sleep, and recovery with structured nightly dosing.',
    features: [
      'Supports GH release patterns',
      'Focus on sleep and recovery',
      'Includes 1 vial',
    ],
    shipping: 'Ships in 1–2 days — Free delivery over $40',
    instructions:
      'Inject subcutaneously in the evening as directed. Keep a consistent bedtime routine and follow your provider’s guidance.',
    sideEffects:
      'May include local irritation, flushing, or headache. Contact your provider if symptoms are severe or persistent.',
    whyChoose: [
      { title: 'GH support', excerpt: 'Backs natural signaling' },
      { title: 'Sleep focus', excerpt: 'Rest and recovery support' },
      { title: 'Structured plan', excerpt: 'Nightly, consistent dosing' },
    ],
    plan: [{ id: 'serm-1', title: 'Single Vial', price: 119, oldPrice: 229, href: '#' }],
    question: [
      { title: 'What is this therapy?', description: 'A peptide protocol using sermorelin aimed at supporting growth-hormone rhythms and restorative sleep.' },
      { title: 'How do I use it?', description: 'Administer subcutaneous injections nightly and keep consistent sleep hygiene.' },
      { title: 'Side effects?', description: 'Occasional flushing or headache may occur. Seek help if persistent or severe.' },
    ],
    howItWorks: [
      { step: 1, title: 'Dose nightly', description: 'Follow the evening dosing plan.' },
      { step: 2, title: 'Support sleep', description: 'Backs recovery and rhythms.' },
      { step: 3, title: 'Assess response', description: 'Provider adjusts as needed.' },
    ],
    images: [{ fallbackUrl: PLACEHOLDER_PRODUCT_IMAGE }],
    metadata: { displayOrder: 3 },
  },
];

const adminSeedBase = {
  records: [
    {
      id: 'admin_rec_base_1',
      medication: 'Semaglutide',
      medicationType: MedicationType.INJECTABLE,
      startDate: '2025-09-01T00:00:00.000Z',
      endDate: '2025-11-01T00:00:00.000Z',
      purchasedAt: '2025-09-01T09:00:00.000Z',
      renewalDate: '2025-11-15T00:00:00.000Z',
      notes: 'Administrative monitoring record.',
    },
  ],
  shots: [
    {
      id: 'admin_shot_base_1',
      date: '2025-09-10T09:00:00.000Z',
      medication: 'Semaglutide',
      doseValue: 1,
      doseUnit: 'mg',
      site: 'Right abdomen',
      painLevel: 1,
      weightKg: 90,
      caloriesAvg: 2100,
      proteinAvgG: 95,
      notes: 'Admin sample shot record.',
    },
  ],
  activities: [
    {
      id: 'admin_act_base_1',
      kind: ActivityKind.NOTE,
      title: 'Admin logged activity',
      subtitle: 'System oversight',
      occurredAt: '2025-10-24T12:00:00.000Z',
    },
  ],
};

function subtractDays(base: Date, days: number): Date {
  const copy = new Date(base);
  copy.setUTCDate(copy.getUTCDate() - days);
  return copy;
}

function addDays(base: Date, days: number): Date {
  const copy = new Date(base);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function buildRecordSeries(
  baseRecords: RecordSeed[],
  count = 10,
): RecordSeed[] {
  if (!baseRecords.length || count <= 0) {
    return [];
  }

  const fallback: RecordSeed = baseRecords[0] ?? {
    id: 'fallback-record',
    medication: 'Semaglutide',
    medicationType: MedicationType.INJECTABLE,
    startDate: '2025-09-01T00:00:00.000Z',
    endDate: '2025-10-01T00:00:00.000Z',
    purchasedAt: '2025-09-01T09:00:00.000Z',
    renewalDate: '2025-10-15T00:00:00.000Z',
    notes: 'Auto-generated record.',
    trackingNumber: 'FDX-FALLBACK',
  };

  const baseStart = new Date(fallback.startDate);

  return Array.from({ length: count }, (_, idx) => {
    const template = baseRecords[idx % baseRecords.length] ?? fallback;
    const start = subtractDays(baseStart, idx * 28);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 28);
    const purchased = new Date(start);
    purchased.setUTCHours(10, 20, 0, 0);
    const renewal = new Date(end);
    renewal.setUTCDate(renewal.getUTCDate() + 7);

    const id = randomUUID();
    return {
      id,
      medication: `${template.medication} Cycle ${idx + 1}`,
      medicationType: template.medicationType ?? fallback.medicationType,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      purchasedAt: purchased.toISOString(),
      renewalDate: renewal.toISOString(),
      notes: template.notes ?? `Auto-generated record ${idx + 1}`,
      trackingNumber:
        template.trackingNumber ??
        `FDX-${id.replace(/-/g, '').slice(0, 12).toUpperCase()}`,
    };
  });
}

function buildShotSeries(baseShots: ShotSeed[], count = 10): ShotSeed[] {
  const fallback: ShotSeed = baseShots[0] ?? {
    id: 'fallback-shot',
    date: '2025-09-10T09:00:00.000Z',
    medication: 'Semaglutide',
    doseValue: 1,
    doseUnit: 'mg',
    site: 'Right abdomen',
    painLevel: 1,
    weightKg: 90,
    caloriesAvg: 2100,
    proteinAvgG: 95,
    notes: 'Auto-generated shot.',
  };

  const baseDate = new Date(fallback.date);

  return Array.from({ length: count }, (_, idx) => {
    const template = baseShots[idx % baseShots.length] ?? fallback;
    const date = subtractDays(baseDate, idx * 7);
    const doseValue = Number(template.doseValue ?? fallback.doseValue) + idx * 0.1;
    const weightKg = Math.max(
      40,
      Number(template.weightKg ?? fallback.weightKg) - idx * 0.4,
    );
    const caloriesAvg = Math.max(
      1200,
      Math.round((template.caloriesAvg ?? fallback.caloriesAvg) - idx * 15),
    );
    const proteinAvgG = Math.max(
      0,
      Math.round(template.proteinAvgG ?? fallback.proteinAvgG) + idx,
    );
    const painLevel = Math.max(
      0,
      Math.min(
        10,
        Math.round((template.painLevel ?? fallback.painLevel) + ((idx % 3) - 1)),
      ),
    );

    return {
      id: randomUUID(),
      date: date.toISOString(),
      medication: template.medication,
      doseValue: parseFloat(doseValue.toFixed(2)),
      doseUnit: template.doseUnit ?? fallback.doseUnit,
      site: template.site ?? `Rotation site ${idx + 1}`,
      painLevel,
      weightKg: parseFloat(weightKg.toFixed(1)),
      caloriesAvg,
      proteinAvgG,
      notes: template.notes ?? `Auto-generated shot ${idx + 1}`,
    };
  });
}

function buildActivitySeries(
  baseActivities: ActivitySeed[],
  count = 10,
): ActivitySeed[] {
  const fallback: ActivitySeed = baseActivities[0] ?? {
    id: 'fallback-activity',
    kind: ActivityKind.NOTE,
    title: 'Progress note',
    subtitle: 'Auto-generated entry',
    occurredAt: '2025-10-24T12:00:00.000Z',
  };

  const baseDate = new Date(fallback.occurredAt);
  const activityKindsSequence = [
    ActivityKind.INJECTION,
    ActivityKind.WEIGHT,
    ActivityKind.WORKOUT,
    ActivityKind.MESSAGE,
    ActivityKind.NOTE,
    ActivityKind.RECORD,
    ActivityKind.SHOT,
  ];

  return Array.from({ length: count }, (_, idx) => {
    const template = baseActivities[idx % baseActivities.length] ?? fallback;
    const occurredAt = subtractDays(baseDate, idx * 2);

    return {
      id: randomUUID(),
      kind:
        template.kind ?? activityKindsSequence[idx % activityKindsSequence.length],
      title: `${template.title} #${idx + 1}`,
      subtitle: template.subtitle ?? `Detail ${idx + 1}`,
      occurredAt: occurredAt.toISOString(),
    };
  });
}

function decimalOrNull(value?: number | null): Prisma.Decimal | null {
  if (value === undefined || value === null) {
    return null;
  }
  return new Prisma.Decimal(value);
}

function sanitizeText(value?: string | null): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function normalizeFeatureList(features?: string[]): string[] {
  if (!Array.isArray(features)) {
    return [];
  }
  return features
    .map((feature) => sanitizeText(feature) ?? '')
    .filter((feature) => feature.length > 0);
}

function normalizePlanOptions(plan?: ProductPlanSeed[]): ProductPlanSeed[] {
  if (!Array.isArray(plan)) {
    return [];
  }
  return plan.map((option, index) => ({
    id: option.id || String(index + 1),
    title: sanitizeText(option.title) ?? `Plan ${index + 1}`,
    price: Number(option.price ?? 0),
    oldPrice:
      option.oldPrice === undefined || option.oldPrice === null
        ? undefined
        : Number(option.oldPrice),
    href: typeof option.href === 'string' ? option.href.trim() : '',
  }));
}

function normalizeFaqs(faqs?: ProductFaqSeed[]): ProductFaqSeed[] {
  if (!Array.isArray(faqs)) {
    return [];
  }
  return faqs.map((faq, index) => ({
    title: sanitizeText(faq?.title) ?? `Question ${index + 1}`,
    description: sanitizeText(faq?.description) ?? '',
  }));
}

function normalizeWhyChoose(
  whyChoose?: ProductWhyChooseSeed[],
): ProductWhyChooseSeed[] {
  if (!Array.isArray(whyChoose)) {
    return [];
  }
  return whyChoose.map((item) => ({
    title: sanitizeText(item?.title) ?? '',
    excerpt: sanitizeText(item?.excerpt) ?? '',
    imgSrc: sanitizeText(item?.imgSrc) ?? PLACEHOLDER_BENEFIT_IMAGE,
  }));
}

function normalizeSteps(
  steps?: ProductHowItWorksSeed[],
): ProductHowItWorksSeed[] {
  if (!Array.isArray(steps)) {
    return [];
  }
  return steps.map((step, index) => ({
    step: Number(step?.step ?? index + 1),
    title: sanitizeText(step?.title) ?? `Step ${index + 1}`,
    description: sanitizeText(step?.description) ?? '',
  }));
}

function normalizeImages(images?: ProductImageSeed[]): ProductImageSeed[] {
  if (!Array.isArray(images)) {
    return [];
  }
  const results: ProductImageSeed[] = [];
  images.forEach((image, index) => {
    const objectKey =
      typeof image?.objectKey === 'string' && image.objectKey.trim().length > 0
        ? image.objectKey.replace(/^\/+/, '')
        : undefined;
    const fallbackUrl =
      sanitizeText(image?.fallbackUrl) ?? PLACEHOLDER_PRODUCT_IMAGE;
    if (!objectKey && !fallbackUrl) {
      return;
    }
    results.push({
      id: image?.id || `image-${index + 1}-${randomUUID()}`,
      bucket: image?.bucket ?? undefined,
      objectKey,
      altText: sanitizeText(image?.altText) ?? undefined,
      fallbackUrl,
      variant: sanitizeText(image?.variant) ?? undefined,
    });
  });
  return results;
}

function mapProductSeed(seed: WeightLossProductSeed): ProductSeedPayload {
  return {
    category: seed.category,
    name: seed.name.trim(),
    href: seed.href.trim(),
    hrefForm: sanitizeText(seed.hrefForm),
    oldPrice: decimalOrNull(seed.oldPrice ?? null),
    price: new Prisma.Decimal(seed.price),
    popular: seed.popular ?? false,
    inStock: seed.inStock ?? true,
    badge: sanitizeText(seed.badge),
    description: sanitizeText(seed.description),
    shipping: sanitizeText(seed.shipping),
    instructions: sanitizeText(seed.instructions),
    sideEffects: sanitizeText(seed.sideEffects),
    features: normalizeFeatureList(seed.features),
    whyChoose: normalizeWhyChoose(seed.whyChoose),
    plan: normalizePlanOptions(seed.plan),
    question: normalizeFaqs(seed.question),
    howItWorks: normalizeSteps(seed.howItWorks),
    images: normalizeImages(seed.images),
    metadata: (seed.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
  };
}

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
    prisma.weightLossProduct.deleteMany(),
    prisma.blog.deleteMany(),
    prisma.refreshSession.deleteMany(),
    prisma.passwordResetToken.deleteMany(),
    prisma.emailVerificationToken.deleteMany(),
    prisma.auditLog.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

async function seedAdmin(adminEmail: string, adminPassword: string) {
  const passwordHash = await hashPassword(adminPassword);

  const records = buildRecordSeries(adminSeedBase.records);
  const shots = buildShotSeries(adminSeedBase.shots);
  const activities = buildActivitySeries(adminSeedBase.activities);

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
      records: {
        create: records.map((record) => ({
          id: record.id,
          medication: record.medication,
          medicationType: record.medicationType ?? null,
          startDate: new Date(record.startDate),
          endDate: record.endDate ? new Date(record.endDate) : null,
          purchasedAt: new Date(record.purchasedAt),
          renewalDate: record.renewalDate
            ? new Date(record.renewalDate)
            : null,
          trackingNumber:
            record.trackingNumber ??
            `FDX-${record.id.replace(/-/g, '').slice(0, 12).toUpperCase()}`,
          notes: record.notes,
        })),
      },
      shots: {
        create: shots.map((shot) => ({
          id: shot.id,
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
        create: activities.map((activity) => ({
          id: activity.id,
          kind: activity.kind,
          title: activity.title,
          subtitle: activity.subtitle,
          occurredAt: new Date(activity.occurredAt),
        })),
      },
    },
  });
}

async function seedPatients() {
  const credentials: Array<{ email: string; password: string }> = [];

  for (const patient of patientSeeds) {
    const passwordHash = await hashPassword(DEFAULT_PASSWORD);
    const hasRecordTemplates = patient.records.length > 0;
    const recordSeriesCount = hasRecordTemplates
      ? patient.recordSeriesCount ?? 10
      : 0;
    const records =
      recordSeriesCount > 0
        ? buildRecordSeries(patient.records, recordSeriesCount)
        : [];
    const shots =
      patient.shots.length > 0 ? buildShotSeries(patient.shots) : [];
    const activities =
      patient.activities.length > 0
        ? buildActivitySeries(patient.activities)
        : [];

    const user = await prisma.user.create({
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
        records: records.length
          ? {
              create: records.map((record) => ({
                id: record.id,
                medication: record.medication,
                medicationType: record.medicationType ?? null,
                startDate: new Date(record.startDate),
                endDate: record.endDate ? new Date(record.endDate) : null,
                purchasedAt: new Date(record.purchasedAt),
                renewalDate: record.renewalDate
                  ? new Date(record.renewalDate)
                  : null,
                trackingNumber:
                  record.trackingNumber ??
                  `FDX-${record.id.replace(/-/g, '').slice(0, 12).toUpperCase()}`,
                notes: record.notes,
              })),
            }
          : undefined,
        shots: shots.length
          ? {
              create: shots.map((shot) => ({
                id: shot.id,
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
            }
          : undefined,
        activities: activities.length
          ? {
              create: activities.map((activity) => ({
                id: activity.id,
                kind: activity.kind,
                title: activity.title,
                subtitle: activity.subtitle,
                occurredAt: new Date(activity.occurredAt),
              })),
            }
          : undefined,
      },
    });

    const userRecords = await prisma.record.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
      take: 2,
    });

    if (!patient.skipRecordAdjustments) {
      if (userRecords[0]) {
        const dueSoon = addDays(new Date(), 3);
        await prisma.record.update({
          where: { id: userRecords[0].id },
          data: {
            renewalDate: dueSoon,
            endDate: subtractDays(dueSoon, 7),
            startDate: subtractDays(dueSoon, 28),
            purchasedAt: subtractDays(dueSoon, 32),
          },
        });
      }

      if (userRecords[1]) {
        const dueLater = addDays(new Date(), 14);
        await prisma.record.update({
          where: { id: userRecords[1].id },
          data: {
            renewalDate: dueLater,
            endDate: subtractDays(dueLater, 7),
            startDate: subtractDays(dueLater, 28),
            purchasedAt: subtractDays(dueLater, 34),
          },
        });
      }
    }

    credentials.push({
      email: patient.profile.email.toLowerCase(),
      password: DEFAULT_PASSWORD,
    });
  }

  return credentials;
}

async function seedRenewalNotifications() {
  const now = new Date();
  const threshold = addDays(now, 7);

  const dueRecords = await prisma.record.findMany({
    where: {
      renewalDate: {
        not: null,
        gte: now,
        lte: threshold,
      },
    },
    select: {
      id: true,
      userId: true,
      medication: true,
      renewalDate: true,
    },
  });

  for (const record of dueRecords) {
    if (!record.renewalDate) {
      continue;
    }

    const dateStr = record.renewalDate.toISOString().split('T')[0];
    const message = `Your ${record.medication} plan renews on ${dateStr}.`;

    await prisma.userNotification.upsert({
      where: {
        userId_recordId: {
          userId: record.userId,
          recordId: record.id,
        },
      },
      update: {
        title: 'Renewal reminder',
        message,
        dueDate: record.renewalDate,
        read: false,
      },
      create: {
        userId: record.userId,
        recordId: record.id,
        title: 'Renewal reminder',
        message,
        dueDate: record.renewalDate,
        read: false,
      },
    });
  }
}

async function seedProducts() {
  for (const product of productSeeds) {
    const payload = mapProductSeed(product);
    await prisma.weightLossProduct.upsert({
      where: { token: product.token },
      update: payload,
      create: {
        token: product.token,
        ...payload,
      },
    });
  }
}

async function seedBlogs() {
  for (const blog of blogSeeds) {
    await prisma.blog.upsert({
      where: { token: blog.token },
      update: {
        title: blog.title,
        excerpt: blog.excerpt,
        category: blog.category,
        imgSrc: blog.imgSrc,
        body: blog.body,
      },
      create: {
        token: blog.token,
        title: blog.title,
        excerpt: blog.excerpt,
        category: blog.category,
        imgSrc: blog.imgSrc,
        body: blog.body,
      },
    });
  }
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

  console.log('Seeding catalog products...');
  await seedProducts();

  console.log('Seeding blogs...');
  await seedBlogs();

  console.log('Seeding notifications...');
  await seedRenewalNotifications();

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
