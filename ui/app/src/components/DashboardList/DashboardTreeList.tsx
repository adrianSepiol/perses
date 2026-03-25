// Copyright The Perses Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { DashboardResource, FolderResource } from '@perses-dev/core';
import { Box, CircularProgress, IconButton, Link, Stack } from '@mui/material';
import { Table, TableColumnConfig, TablePaginationState, TableSortingState } from '@perses-dev/components';
import DeleteIcon from 'mdi-material-ui/DeleteOutline';
import PencilIcon from 'mdi-material-ui/Pencil';
import ContentCopyIcon from 'mdi-material-ui/ContentCopy';
import ChevronDownIcon from 'mdi-material-ui/ChevronDown';
import ChevronRightIcon from 'mdi-material-ui/ChevronRight';
import FolderOutlineIcon from 'mdi-material-ui/FolderOutline';
import ViewDashboardOutlineIcon from 'mdi-material-ui/ViewDashboardOutline';
import AddFolderOutlineIcon from 'mdi-material-ui/FolderPlusOutline';
import { ReactElement, useMemo, useState } from 'react';
import { CRUDIconButton } from '../CRUDButton/CRUDIconButton';
import { buildTableRows, formatAbsoluteTime, formatRelativeTime } from '../../utils/tableUtils';

export interface DashboardTreeTableRow {
  kind: 'Folder' | 'Dashboard';
  name: string;
  displayName: string;
  project: string;
  path: string[];
  createdAt?: Date;
  updatedAt?: Date;
  tags?: string[];
  version?: number;
  children?: DashboardTreeTableRow[];
}

export interface DashboardTreeTableProps {
  folderList: FolderResource[];
  dashboardsMap: Map<string, Map<string, DashboardResource>>;
  handleRenameButtonClick: (project: string, name: string) => () => void;
  handleDuplicateButtonClick: (project: string, name: string) => () => void;
  handleDeleteButtonClick: (project: string, name: string) => () => void;
  handleEditFolderButtonClick: (project: string, name: string, path: string[]) => () => void;
  handleAddFolderButtonClick: (project: string, name: string, path: string[]) => () => void;
  handleDeleteFolderButtonClick: (project: string, name: string, path: string[]) => () => void;
  height: number;
  isLoading?: boolean;
}

function DashboardTreeList({
  folderList,
  dashboardsMap,
  handleDeleteButtonClick,
  handleDuplicateButtonClick,
  handleRenameButtonClick,
  handleEditFolderButtonClick,
  handleAddFolderButtonClick,
  handleDeleteFolderButtonClick,
  height,
  isLoading,
}: DashboardTreeTableProps): ReactElement {
  const rows: DashboardTreeTableRow[] = useMemo(() => {
    return buildTableRows(folderList, dashboardsMap);
  }, [folderList, dashboardsMap]);

  const columns = useMemo<Array<TableColumnConfig<DashboardTreeTableRow>>>(
    () => [
      {
        id: 'project',
        accessorKey: 'project',
        header: 'Project',
        align: 'left',
        enableSorting: true,
      },
      {
        id: 'name',
        accessorKey: 'displayName',
        header: 'Name',
        headerDescription: 'Dashboard or folder name',
        align: 'left',
        enableSorting: true,
        enableHiding: false,
        cellDescription: (): string => '',
        cell: ({ row, getValue }): ReactElement => {
          const value = getValue() as string;
          const kind = row.original.kind;
          const paddingLeft = kind === 'Folder' ? row.depth * 24 : (row.depth + 1) * 24;
          return (
            <Box sx={{ paddingLeft: paddingLeft + 'px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {kind === 'Folder' ? (
                <>
                  <IconButton onClick={row.getToggleExpandedHandler()} sx={{ padding: 0 }}>
                    {row.getIsExpanded() ? <ChevronDownIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
                  </IconButton>
                  <FolderOutlineIcon fontSize="small" />
                  {value}
                </>
              ) : (
                <>
                  <ViewDashboardOutlineIcon fontSize="small" />
                  <Link
                    href={`/projects/${row.original.project}/dashboards/${row.original.name}`}
                    color="inherit"
                    underline="hover"
                  >
                    {value}
                  </Link>
                </>
              )}
            </Box>
          );
        },
      },
      {
        id: 'tags',
        accessorKey: 'tags',
        header: 'Tags',
        align: 'left',
        enableSorting: true,
      },
      {
        id: 'version',
        accessorKey: 'version',
        header: 'Version',
        align: 'left',
        enableSorting: true,
      },
      {
        id: 'createdAt',
        accessorKey: 'createdAt',
        header: 'Creation Date',
        align: 'left',
        enableSorting: true,
        cellDescription: ({ getValue }): string => formatAbsoluteTime(getValue()),
        cell: ({ getValue }): string | undefined => formatRelativeTime(getValue()),
      },
      {
        id: 'updatedAt',
        accessorKey: 'updatedAt',
        header: 'Last Update',
        align: 'left',
        enableSorting: true,
        cellDescription: ({ getValue }): string => formatAbsoluteTime(getValue()),
        cell: ({ getValue }): string | undefined => formatRelativeTime(getValue()),
      },
      {
        id: 'actions',
        accessorKey: 'actions',
        header: 'Actions',
        align: 'center',
        width: 75,
        enableHiding: false,
        cellDescription: (): string => '',
        cell: ({ row }): ReactElement | undefined => {
          if (row.original.kind === 'Dashboard') {
            return (
              <Stack direction="row" gap={1} alignItems="center" justifyContent="center">
                <CRUDIconButton
                  key={row.original.name + '-edit'}
                  label="Edit"
                  action="update"
                  scope="Dashboard"
                  project={row.original.project}
                  onClick={handleRenameButtonClick(row.original.project, row.original.name)}
                >
                  <PencilIcon />
                </CRUDIconButton>
                <CRUDIconButton
                  key={row.original.name + '-duplicate'}
                  label="Duplicate"
                  action="create"
                  scope="Dashboard"
                  project={row.original.project}
                  onClick={handleDuplicateButtonClick(row.original.project, row.original.name)}
                >
                  <ContentCopyIcon />
                </CRUDIconButton>
                <CRUDIconButton
                  key={row.original.name + '-delete'}
                  label="Delete"
                  action="delete"
                  scope="Dashboard"
                  project={row.original.project}
                  onClick={handleDeleteButtonClick(row.original.project, row.original.name)}
                >
                  <DeleteIcon />
                </CRUDIconButton>
              </Stack>
            );
          }
          if (row.original.kind === 'Folder') {
            return (
              <Stack direction="row" gap={1} alignItems="center" justifyContent="center">
                <CRUDIconButton
                  key={row.original.name + '-edit'}
                  label="Edit"
                  action="update"
                  scope="Folder"
                  project={row.original.project}
                  onClick={handleEditFolderButtonClick(row.original.project, row.original.name, row.original.path)}
                >
                  <PencilIcon />
                </CRUDIconButton>
                <CRUDIconButton
                  key={row.original.name + '-add'}
                  label="Add Folder"
                  action="create"
                  scope="Folder"
                  project={row.original.project}
                  onClick={handleAddFolderButtonClick(row.original.project, row.original.name, row.original.path)}
                >
                  <AddFolderOutlineIcon />
                </CRUDIconButton>
                <CRUDIconButton
                  key={row.original.name + '-delete'}
                  label="Delete"
                  action="delete"
                  scope="Folder"
                  project={row.original.project}
                  onClick={handleDeleteFolderButtonClick(row.original.project, row.original.name, row.original.path)}
                >
                  <DeleteIcon />
                </CRUDIconButton>
              </Stack>
            );
          }
        },
      },
    ],
    [
      handleAddFolderButtonClick,
      handleDeleteButtonClick,
      handleDeleteFolderButtonClick,
      handleDuplicateButtonClick,
      handleEditFolderButtonClick,
      handleRenameButtonClick,
    ]
  );

  const [sorting, setSorting] = useState<TableSortingState>([{ id: 'name', desc: false }]);
  const [pagination, setPagination] = useState<TablePaginationState>({ pageIndex: 0, pageSize: 10 });

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: height,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Table
      data={rows}
      columns={columns}
      getRowId={(row) => `${row.project}/${row.path.join('/')}/${row.name}/${row.kind}`}
      height={height}
      width="100%"
      sorting={sorting}
      onSortingChange={setSorting}
      pagination={pagination}
      onPaginationChange={setPagination}
      getSubRows={(row: DashboardTreeTableRow): DashboardTreeTableRow[] | undefined => row.children}
      hiddenColumns={['project', 'version']}
      showSearch={true}
      showColumnFilter={true}
    />
  );
}

export default DashboardTreeList;
