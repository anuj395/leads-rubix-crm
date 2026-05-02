import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

export default function ContactsListPage() {
  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, width: "100%", minWidth: 0 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Contacts List
      </Typography>
      <Typography color="text.secondary">Placeholder page for Contacts List.</Typography>
    </Box>
  )
}
