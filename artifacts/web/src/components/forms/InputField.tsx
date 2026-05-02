import TextField from '@mui/material/TextField'
import type { TextFieldProps } from '@mui/material/TextField'

export function InputField(props: TextFieldProps) {
  return (
    <TextField
      fullWidth
      size="small"
      variant="outlined"
      {...props}
      sx={{
        // Labels
        '& .MuiFormLabel-root': {
          fontSize: 'clamp(0.8125rem, 2vw, 0.875rem)',
        },
        // Input text — 16px minimum on mobile to prevent iOS zoom
        '& .MuiInputBase-input': {
          fontSize: 'clamp(16px, 2vw, 0.9375rem)',
          // On larger screens, don't need the 16px minimum
          '@media (min-width: 600px)': {
            fontSize: '0.9375rem',
          },
          // Comfortable touch target on mobile
          paddingBlock: 'clamp(0.5625rem, 1.5vw, 0.6875rem)',
        },
        // Helper text
        '& .MuiFormHelperText-root': {
          fontSize: '0.75rem',
          marginTop: '0.25rem',
        },
        // Ensure full width always
        width: '100%',
        ...props.sx,
      }}
    />
  )
}
