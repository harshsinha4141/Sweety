// Options shared by the register page and profile settings (must match the backend whitelist).
export const GENDER_OPTIONS = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
]

// Editable profile fields per role (settings → ProfileForm).
export const PATIENT_PROFILE_FIELDS = ['full_name', 'email', 'phone_number', 'date_of_birth', 'gender', 'blood_group', 'height_cm']
export const DOCTOR_PROFILE_FIELDS = ['full_name', 'email', 'phone_number']

export const BLOOD_GROUP_OPTIONS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((g) => ({ value: g, label: g }))
