import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

export default function BookingsListPage() {
  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, width: "100%", minWidth: 0 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Bookings List
      </Typography>
      <Typography color="text.secondary">Placeholder page for Bookings List.</Typography>
    </Box>
  )
}
