import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

export default function AnalyticsPage() {
  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, width: "100%", minWidth: 0 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Analytics
      </Typography>
      <Typography color="text.secondary">Placeholder page for Analytics.</Typography>
    </Box>
  )
}
