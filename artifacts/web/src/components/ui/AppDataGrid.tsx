import Box from '@mui/material/Box'
import { DataGrid, GridToolbar, type DataGridProps } from '@mui/x-data-grid'

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
  ...rest
}: AppDataGridProps) {
  return (
    <Box sx={{ height, width: '100%' }}>
      <DataGrid
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
        pageSizeOptions={pageSizeOptions ?? [10, 25, 50, 100]}
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
          ...(sx ?? {}),
        }}
        {...rest}
      />
    </Box>
  )
}
