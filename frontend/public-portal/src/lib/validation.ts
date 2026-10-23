import { z } from 'zod';

export const COMPLAINT_CATEGORIES = [
  { value: 'Scholarship', label: 'Scholarship & Financial Aid' },
  { value: 'Academic', label: 'Academic Irregularity & Curriculum' },
  { value: 'Fee & Refund', label: 'Fee Overcharging & Refund Disallowance' },
  { value: 'Faculty & Staff', label: 'Faculty Deficiency & Unqualified Staff' },
  { value: 'Infrastructure', label: 'Inadequate Labs & Infrastructure' },
  { value: 'Admission & Enrollment', label: 'Admission Irregularity / Capitation Fee' },
  { value: 'Harassment & Safety', label: 'Harassment, Ragging & Campus Safety' },
  { value: 'Administrative', label: 'Administrative Mismanagement & Withholding Documents' },
  { value: 'Other', label: 'Other Grievance' },
] as const;

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry', 'Chandigarh'
] as const;

export const INSTITUTION_TYPES = [
  'Engineering & Technology College',
  'Management Institute',
  'Pharmacy College',
  'Architecture & Planning Institute',
  'Polytechnic / Diploma Institution',
  'MCA / Computer Applications Institute',
  'Hotel Management & Catering',
  'Deemed / Autonomous University',
  'Affiliated College'
] as const;

export const step1InstitutionSchema = z.object({
  institution_id: z.string().uuid('Please select a verified institution'),
  institution_name: z
    .string()
    .min(2, 'Institution name must be at least 2 characters')
    .max(255, 'Institution name must be less than 255 characters'),
  institution_permanent_id: z
    .string()
    .max(100, 'Permanent ID must be less than 100 characters')
    .optional()
    .or(z.literal('')),
  state: z.string().min(1, 'Please select a state or Union Territory'),
  district: z.string().min(1, 'Please select a district').max(100, 'District name must be less than 100 characters'),
  institution_type: z
    .string()
    .optional()
    .or(z.literal('')),
});

export const step2DetailsSchema = z.object({
  category: z
    .string()
    .min(2, 'Please select a complaint category'),
  subcategory: z.string().min(2, 'Please select a subcategory'),
  specific_issue: z.string().min(2, 'Please select the specific issue'),
  subject: z
    .string()
    .min(3, 'Subject must be at least 3 characters')
    .max(255, 'Subject must be less than 255 characters'),
  description: z
    .string()
    .min(10, 'Detailed description must be at least 10 characters describing the grievance')
    .max(5000, 'Description must not exceed 5000 characters'),
  incident_date: z
    .string()
    .optional()
    .or(z.literal('')),
  assigned_bureau: z
    .string()
    .optional()
    .or(z.literal('')),
});

export const step3SupportingSchema = z.object({
  complainant_name: z
    .string()
    .min(2, 'Your name must be at least 2 characters'),
  complainant_email: z
    .string()
    .email('Please enter a valid email address'),
  complainant_phone: z
    .string()
    .max(20, 'Phone number must be valid')
    .optional()
    .or(z.literal('')),
  consent_privacy: z
    .boolean()
    .refine((val) => val === true, {
      message: 'You must acknowledge the grievance processing and privacy terms',
    }),
  accuracy_confirmed: z
    .boolean()
    .refine((val) => val === true, {
      message: 'You must confirm the factual accuracy of the provided information',
    }),
});

export const fullComplaintSchema = step1InstitutionSchema
  .merge(step2DetailsSchema)
  .merge(step3SupportingSchema);

export type FullComplaintFormData = z.infer<typeof fullComplaintSchema>;

export const trackComplaintSchema = z.object({
  reference: z
    .string()
    .min(1, 'Complaint reference is required')
    .transform((val) => val.trim().toUpperCase())
    .refine(
      (val) => /^CL-\d{4}-\d{5}$/i.test(val) || /^CL-[\w-]+$/i.test(val),
      'Reference should match the format CL-YYYY-NNNNN (e.g. CL-2026-00001)'
    ),
});

export type TrackComplaintFormData = z.infer<typeof trackComplaintSchema>;
