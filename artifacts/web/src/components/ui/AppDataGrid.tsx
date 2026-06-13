import { useMemo } from 'react'
import Box from '@mui/material/Box'
import { DataGrid, GridToolbar, type DataGridProps } from '@mui/x-data-grid'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'

export type AppDataGridProps = DataGridProps & {
  /**
   * Height of the scroll container. Defaults to `80vh` so the column header
   * stays sticky and the body scrolls underneath, matching the MUI docs
   * pattern. Pass any CSS height override if a page wants something taller
   * or shorter.
   */
  height?: string | number
  /**
   * When true, hides the floating toolbar (Columns / Filter / Density /
   * Export / Quick filter). Default false. The per-column "three-dots" menu
   * (Sort, Filter, Hide column, Manage columns) is part of DataGrid itself
   * and is always available regardless.
   */
  hideToolbar?: boolean
}

/**
 * Project-wide table built on `<DataGrid />`. Centralises the conventions we
 * want everywhere:
 *
 *   • sticky column header (`80vh` container + DataGrid's built-in sticky)
 *   • column header three-dots menu: Sort ASC/DESC, Filter, Hide, Manage cols
 *   • toolbar with quick filter, column visibility, density and CSV export
 *   • sensible default page-size options
 *   • optional server-side pagination (`paginationMode="server"`) — caller
 *     supplies `rowCount`, `paginationModel`, `onPaginationModelChange`
 *
 * Use this component for every list/table in the app so all tables look,
 * behave and scale the same way.
 */
export function AppDataGrid({
  height = '80vh',
  hideToolbar = false,
  sx,
  slots,
  slotProps,
  pageSizeOptions,
  initialState,
  getRowId,
  columns,
  ...rest
}: AppDataGridProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const totalCount = rest.rowCount ?? rest.rows?.length ?? 0
  const computedPageSizeOptions = useMemo(() => {
    if (pageSizeOptions) return pageSizeOptions

    const base = [25, 50, 100]
    if (totalCount > 0 && !base.includes(totalCount)) {
      base.push(totalCount)
    }
    const uniqueSorted = Array.from(new Set(base)).sort((a, b) => a - b)
    return uniqueSorted.map((val) => {
      if (val === totalCount) {
        return { value: val, label: `All (${val})` }
      }
      return val
    })
  }, [pageSizeOptions, totalCount])

  // On mobile, convert flex columns to fixed widths to force horizontal scrolling
  // and prevent text columns from shrinking to unreadable vertical strips.
  const responsiveColumns = useMemo(() => {
    if (!columns) return []
    if (!isMobile) return columns

    return columns.map((col) => {
      const updated = { ...col }
      if (updated.flex) {
        const flexVal = typeof updated.flex === 'number' ? updated.flex : 1
        updated.width = flexVal * 150
        delete updated.flex
      }
      if (!updated.width && !updated.minWidth) {
        updated.width = 120
      }
      return updated
    })
  }, [columns, isMobile])

  return (
    <Box sx={{ height, width: '100%' }}>
      <DataGrid
        columns={responsiveColumns}
        // The per-column three-dots menu is the DataGrid default; nothing to
        // wire here. Adding the toolbar gives Columns / Filter / Density /
        // Export and a quick search box.
        slots={hideToolbar ? slots : { toolbar: GridToolbar, ...(slots ?? {}) }}
        slotProps={
          hideToolbar
            ? slotProps
            : {
                toolbar: {
                  showQuickFilter: true,
                  quickFilterProps: { debounceMs: 300 },
                },
                ...(slotProps ?? {}),
              }
        }
        pageSizeOptions={computedPageSizeOptions}
        initialState={{
          pagination: { paginationModel: { page: 0, pageSize: 25 } },
          ...(initialState ?? {}),
        }}
        // If the row objects use Mongo-style `_id`, surface it as the row id
        // by default so callers don't have to repeat this on every page.
        getRowId={
          getRowId ??
          ((row: Record<string, unknown>) =>
            (row._id as string | number | undefined) ??
            (row.id as string | number | undefined) ??
            JSON.stringify(row))
        }
        disableRowSelectionOnClick
        density="compact"
        sx={{
          // Column header background follows the theme so dark mode looks right.
          '& .MuiDataGrid-columnHeaders': {
            position: 'sticky',
            top: 0,
            zIndex: 2,
            bgcolor: 'background.paper',
          },
          '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
            outline: 'none',
          },
          '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': {
            outline: 'none',
          },
          // Responsive styling overrides for mobile screens
          ...(isMobile
            ? {
                // Keep toolbar in a single non-wrapping horizontally-scrollable row
                '& .MuiDataGrid-toolbarContainer': {
                  flexWrap: 'nowrap !important',
                  overflowX: 'auto !important',
                  gap: '8px !important',
                  padding: '6px 8px !important',
                  // Hide scrollbar track for clean presentation
                  '::-webkit-scrollbar': {
                    display: 'none !important',
                  },
                  msOverflowStyle: 'none !important',
                  scrollbarWidth: 'none !important',
                  // Compress button text to show only icon badges
                  '& button': {
                    fontSize: '0 !important',
                    minWidth: '0 !important',
                    padding: '4px 8px !important',
                    '& .MuiButton-startIcon': {
                      margin: '0 !important',
                      fontSize: '1.25rem !important',
                    },
                  },
                },
                // Compress search quick filter input to sit neatly beside icon buttons
                '& .MuiDataGrid-toolbarContainer .MuiTextField-root': {
                  minWidth: '100px !important',
                  flexShrink: 1,
                  margin: '0 !important',
                  '& .MuiInputBase-input': {
                    padding: '4px 6px !important',
                    fontSize: '0.8rem !important',
                  },
                },
                // Tighten fonts in grid cells & headers to maximize screen space
                '& .MuiDataGrid-columnHeaderTitle': {
                  fontSize: '0.8rem !important',
                },
                '& .MuiDataGrid-cell': {
                  fontSize: '0.8rem !important',
                },
              }
            : {}),
          ...(sx ?? {}),
        }}
        {...rest}
      />
    </Box>
  )
}
