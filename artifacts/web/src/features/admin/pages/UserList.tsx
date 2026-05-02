import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

export default function UserListPage() {
  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, width: "100%", minWidth: 0 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        User List
      </Typography>
      <Typography color="text.secondary">Placeholder page for User List.</Typography>
    </Box>
  )
}
