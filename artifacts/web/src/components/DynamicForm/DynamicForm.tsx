/**
 * components/DynamicForm
 *
 * Renders a 3-column responsive form based on the dynamic screen-config
 * resolved for the authenticated user. Field types supported:
 *   - text, email, number, textarea, date, checkbox  → native MUI inputs
 *   - select with dropdown_source='static'           → <Select> from `options[]`
 *   - select with dropdown_source='api'              → fetches dropdown_api on
 *                                                       first render (cached)
 *   - badge / avatar                                 → treated as text inputs
 *                                                       (form context, not table)
 *
 * Required fields show a red `*`. Empty required fields block submission.
 *
 * Dropdown API responses must be either:
 *   - { items: [{ value, label }, ...] } (preferred)
 *   - { items: ["a", "b", ...] }
 *   - [{ value, label }, ...]
 *   - ["a", "b", ...]
 */
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import { resolveScreen, type ResolvedFormField } from '@/services/screenAdminService'
import { api } from '@/services/api'

type Value = string | number | boolean | null

interface DropdownOption {
  value: string
  label: string
}

function normalizeOptions(raw: unknown): DropdownOption[] {
  // Accept array or {items: array}; entries can be strings or {value,label}.
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { items?: unknown })?.items)
      ? ((raw as { items: unknown[] }).items)
      : []
  return list.map((entry) => {
    if (entry && typeof entry === 'object') {
      const e = entry as Record<string, unknown>
      const v = e.value ?? e.id ?? e.key ?? e.label ?? ''
      const l = e.label ?? e.name ?? e.title ?? String(v)
      return { value: String(v), label: String(l) }
    }
    return { value: String(entry), label: String(entry) }
  })
}

// Module-level cache so re-mounting the form doesn't refetch the same dropdown.
const dropdownCache = new Map<string, DropdownOption[]>()

interface Props {
  screen: string
  /** Optional override; only honored server-side for superAdmin callers. */
  industry_code?: string
  /** Optional override; only honored server-side for superAdmin callers. */
  role_key?: string
  initialValues?: Record<string, Value>
  onSubmit: (values: Record<string, Value>) => Promise<void> | void
  onCancel?: () => void
  submitLabel?: string
  /** Optional extra fields rendered above the dynamic ones (e.g. core User fields). */
  headerSlot?: ReactNode
  /** Hide built-in submit/cancel actions when the parent provides its own. */
  hideActions?: boolean
}

export function DynamicForm({
  screen,
  industry_code,
  role_key,
  initialValues = {},
  onSubmit,
  onCancel,
  submitLabel = 'Save',
  headerSlot,
  hideActions = false,
}: Props) {
  const [fields, setFields] = useState<ResolvedFormField[]>([])
  const [values, setValues] = useState<Record<string, Value>>(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [loadingConfig, setLoadingConfig] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Per-field async dropdown state. Keyed by `dropdown_api` URL so two fields
  // pointing at the same source share results.
  const [dropdowns, setDropdowns] = useState<Record<string, DropdownOption[]>>({})
  const [dropdownLoading, setDropdownLoading] = useState<Record<string, boolean>>({})

  // 1) Load form config. Re-runs when screen/role/industry change so the
  // Add/Edit User flow can swap fields the instant a different role is
  // selected.
  useEffect(() => {
    let cancelled = false
    setLoadingConfig(true)
    void (async () => {
      try {
        const data = await resolveScreen({
          screen_key: screen,
          industry_code,
          role_key,
        })
        if (cancelled) return
        setFields(data.form_fields)
        // Seed defaults for newly-introduced fields without clobbering user input.
        setValues((prev) => {
          const next = { ...prev }
          for (const f of data.form_fields) {
            if (next[f.key] === undefined) {
              next[f.key] = f.type === 'checkbox' ? false : ''
            }
          }
          return next
        })
      } catch (err) {
        if (cancelled) return
        // A missing screen/role/industry combo just means "no extra fields are
        // configured for this context" — which is a perfectly valid state for
        // an Add/Edit dialog. Don't surface that as an error toast; only flag
        // genuine network/server failures.
        const status = (err as { response?: { status?: number } })?.response?.status
        if (status === 404 || status === 400) {
          setFields([])
        } else {
          const msg = err instanceof Error ? err.message : 'Failed to load form'
          setSubmitError(msg)
        }
      } finally {
        if (!cancelled) setLoadingConfig(false)
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, industry_code, role_key])

  // 2) Lazy-load API dropdowns once we know which fields need them.
  useEffect(() => {
    let cancelled = false
    const apiFields = fields.filter(
      (f) => f.type === 'select' && f.dropdown_source === 'api' && f.dropdown_api,
    )
    for (const f of apiFields) {
      const url = f.dropdown_api
      if (dropdownCache.has(url)) {
        // already cached — hydrate immediately
        setDropdowns((prev) => (prev[url] ? prev : { ...prev, [url]: dropdownCache.get(url)! }))
        continue
      }
      // Resolve the URL:
      //   - absolute (http/https) → call axios with the full URL (skips baseURL)
      //   - "/api/..."           → strip the leading "/api/" since axios baseURL already includes it
      //   - "/foo/..."           → strip the leading slash
      const isAbsolute = /^https?:\/\//i.test(url)
      const path = isAbsolute
        ? url
        : url.replace(/^\/+/, '').replace(/^api\//, '')
      setDropdownLoading((prev) => ({ ...prev, [url]: true }))
      void api
        .get(path)
        .then((res) => {
          if (cancelled) return
          const opts = normalizeOptions(res.data)
          dropdownCache.set(url, opts)
          setDropdowns((prev) => ({ ...prev, [url]: opts }))
        })
        .catch((err) => {
          if (cancelled) return
          // Surface a soft error inline next to the field.
          setErrors((prev) => ({
            ...prev,
            [`__dropdown__${url}`]:
              err?.response?.data?.message ?? `Failed to load options from ${url}`,
          }))
        })
        .finally(() => {
          if (!cancelled) {
            setDropdownLoading((prev) => ({ ...prev, [url]: false }))
          }
        })
    }
    return () => {
      cancelled = true
    }
  }, [fields])

  const setValue = (key: string, value: Value) => {
    setValues((prev) => ({ ...prev, [key]: value }))
    // Clear field-level error on change
    setErrors((prev) => (prev[key] ? { ...prev, [key]: '' } : prev))
  }

  const validate = useMemo(
    () => () => {
      const next: Record<string, string> = {}
      for (const f of fields) {
        if (f.required) {
          const v = values[f.key]
          if (v === undefined || v === null || v === '' || v === false) {
            next[f.key] = `${f.label} is required`
          }
        }
      }
      return next
    },
    [fields, values],
  )

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitError(null)
    const v = validate()
    setErrors(v)
    if (Object.keys(v).length > 0) return
    setSubmitting(true)
    try {
      await onSubmit(values)
    } catch (err: unknown) {
      const e2 = err as { response?: { data?: { message?: string } }; message?: string }
      setSubmitError(e2?.response?.data?.message ?? e2?.message ?? 'Submit failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingConfig) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      {headerSlot}

      {fields.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
          No additional dynamic fields are configured for this role.
        </Typography>
      ) : (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
          gap: 2,
        }}
      >
        {fields.map((f) => {
          const value = values[f.key]
          const err = errors[f.key] || ''
          const labelWithRequired = f.required ? `${f.label} *` : f.label

          if (f.type === 'select') {
            const apiUrl = f.dropdown_api
            let opts: DropdownOption[] = []
            if (f.dropdown_source === 'api' && apiUrl) {
              opts = dropdowns[apiUrl] ?? []
            } else if (f.dropdown_source === 'static') {
              opts = (f.options || []).map((o) => ({ value: o, label: o }))
            } else {
              opts = (f.options || []).map((o) => ({ value: o, label: o }))
            }
            const isLoading = f.dropdown_source === 'api' && !!apiUrl && dropdownLoading[apiUrl]
            const dropdownErr =
              f.dropdown_source === 'api' && apiUrl ? errors[`__dropdown__${apiUrl}`] : ''
            return (
              <TextField
                key={f.key}
                select
                size="small"
                label={labelWithRequired}
                value={(value as string) ?? ''}
                onChange={(e) => setValue(f.key, e.target.value)}
                error={!!err || !!dropdownErr}
                helperText={err || dropdownErr || (isLoading ? 'Loading options…' : '')}
                disabled={isLoading}
                fullWidth
              >
                <MenuItem value=""><em>—</em></MenuItem>
                {opts.map((o) => (
                  <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                ))}
              </TextField>
            )
          }

          if (f.type === 'textarea') {
            return (
              <TextField
                key={f.key}
                size="small"
                label={labelWithRequired}
                value={(value as string) ?? ''}
                onChange={(e) => setValue(f.key, e.target.value)}
                error={!!err}
                helperText={err}
                multiline
                rows={3}
                fullWidth
                sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}
              />
            )
          }

          if (f.type === 'checkbox') {
            return (
              <FormControlLabel
                key={f.key}
                control={
                  <Checkbox
                    checked={!!value}
                    onChange={(e) => setValue(f.key, e.target.checked)}
                  />
                }
                label={labelWithRequired}
              />
            )
          }

          // text-like inputs
          const inputType =
            f.type === 'email' ? 'email' :
            f.type === 'number' ? 'number' :
            f.type === 'date' ? 'date' :
            'text'
          return (
            <TextField
              key={f.key}
              size="small"
              type={inputType}
              label={labelWithRequired}
              value={(value as string | number) ?? ''}
              onChange={(e) => setValue(
                f.key,
                inputType === 'number' && e.target.value !== ''
                  ? Number(e.target.value)
                  : e.target.value,
              )}
              error={!!err}
              helperText={err}
              fullWidth
              InputLabelProps={inputType === 'date' ? { shrink: true } : undefined}
            />
          )
        })}
      </Box>
      )}

      {submitError && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setSubmitError(null)}>
          {submitError}
        </Alert>
      )}

      {!hideActions && (
        <Stack direction="row" spacing={2} sx={{ mt: 3, justifyContent: 'flex-end' }}>
          {onCancel && (
            <Button onClick={onCancel} disabled={submitting}>Cancel</Button>
          )}
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? <CircularProgress size={18} sx={{ color: 'white' }} /> : submitLabel}
          </Button>
        </Stack>
      )}
    </Box>
  )
}

export default DynamicForm
