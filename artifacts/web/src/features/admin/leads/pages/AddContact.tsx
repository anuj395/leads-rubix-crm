import Box from '@mui/material/Box'
import { useNavigate } from 'react-router-dom'
import { AppCard } from '@/components/ui/AppCard'
import { DynamicForm } from '@/components/DynamicForm/DynamicForm'
import { createContact } from '@/services/contactsService'

const AddContactPage = () => {
  const navigate = useNavigate()

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, width: "100%", minWidth: 0 }}>
      <AppCard
        title="Add New Contact"
        subtitle="Create a new client contact. Fields and requirements are configured dynamically."
      >
        <Box sx={{ mt: 2 }}>
          <DynamicForm
            screen="contacts"
            onSubmit={async (values) => {
              await createContact(values)
              navigate('/leads/contacts')
            }}
            onCancel={() => navigate('/leads/contacts')}
            submitLabel="Create Contact"
          />
        </Box>
      </AppCard>
    </Box>
  )
}

export default AddContactPage
