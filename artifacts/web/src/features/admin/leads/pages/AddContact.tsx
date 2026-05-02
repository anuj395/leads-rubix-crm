import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

const AddContactPage = () => {
  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, width: "100%", minWidth: 0 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        ADD CONTACT
      </Typography>
      <Typography color="text.secondary">Placeholder page for adding a new contact.</Typography>
    </Box>
  )
}

export default AddContactPage
