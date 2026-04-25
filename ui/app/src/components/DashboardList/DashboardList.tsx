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

import {
  DashboardResource,
  DashboardSelector,
  EphemeralDashboardInfo,
  FolderResource,
  getResourceDisplayName,
  getResourceExtendedDisplayName,
} from '@perses-dev/core';
import { Card, Stack } from '@mui/material';
import { ReactElement, useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from '@perses-dev/components';
import { GridInitialStateCommunity } from '@mui/x-data-grid/models/gridStateCommunity';
import { useDeleteDashboardMutation } from '../../model/dashboard-client';
import { ListProperties } from '../list';
import {
  AddFolderDialog,
  CreateDashboardDialog,
  DeleteResourceDialog,
  EditDashboardDialog,
  EditFolderDialog,
} from '../dialogs';
import { DeleteFolderDialog } from '../dialogs/DeleteFolderDialog';
import DashboardTreeList from './DashboardTreeList';
import { DashboardFlatList } from './DashboardFlatList';

type editDashboardAction = { type: 'editDashboard'; target: DashboardResource };
type duplicateDashboardAction = { type: 'duplicateDashboard'; target: DashboardResource };
type deleteDashboardAction = { type: 'deleteDashboard'; target: DashboardResource };
type deleteFolderAction = { type: 'deleteFolder'; target: FolderResource; path: string[] };
type editFolderAction = {
  type: 'editFolder';
  target: FolderResource;
  availableDashboards: Map<string, DashboardResource>;
  path: string[];
};
type addFolder = {
  type: 'addFolder';
  target: FolderResource;
  availableDashboards: Map<string, DashboardResource>;
  path: string[];
};
type openDialogAction =
  | editDashboardAction
  | duplicateDashboardAction
  | deleteDashboardAction
  | editFolderAction
  | addFolder
  | deleteFolderAction
  | { type: 'none' };
type openDialogActionType = openDialogAction['type'];

export interface DashboardListProperties extends ListProperties {
  dashboardList: DashboardResource[];
  folderList: FolderResource[];
  isEphemeralDashboardEnabled: boolean;
  viewMode?: 'flat' | 'tree';
  initialState?: GridInitialStateCommunity;
}

/**
 * Display dashboards in a table style.
 * @param props.dashboardList Contains all dashboards to display
 * @param props.hideToolbar Hide toolbar if enabled
 * @param props.initialState Provide a way to override default initialState
 * @param props.isLoading Display a loading circle if enabled
 * @param props.isEphemeralDashboardEnabled Display switch button if ephemeral dashboards are enabled in copy dialog.
 */
export function DashboardList(props: DashboardListProperties): ReactElement {
  const navigate = useNavigate();
  const {
    dashboardList,
    folderList,
    hideToolbar,
    isLoading,
    initialState,
    isEphemeralDashboardEnabled,
    viewMode = 'flat',
  } = props;
  const { successSnackbar, exceptionSnackbar } = useSnackbar();
  const deleteDashboardMutation = useDeleteDashboardMutation();

  const dashboardsMap = useMemo(() => {
    const map = new Map<string, Map<string, DashboardResource>>();
    dashboardList.forEach((dashboard) => {
      const projectMap = map.get(dashboard.metadata.project) ?? new Map<string, DashboardResource>();
      projectMap.set(dashboard.metadata.name, dashboard);
      map.set(dashboard.metadata.project, projectMap);
    });
    return map;
  }, [dashboardList]);

  const [activeDialog, setActiveDialog] = useState<openDialogAction>({ type: 'none' });

  const openDialog = useCallback(
    (dialog: openDialogActionType) => (project: string, name: string, path?: string[]) => (): void => {
      switch (dialog) {
        case 'editDashboard':
        case 'duplicateDashboard':
        case 'deleteDashboard': {
          const dashboard = dashboardsMap.get(project)?.get(name);
          if (dashboard) {
            setActiveDialog({ type: dialog, target: dashboard });
          }
          break;
        }
        case 'editFolder': {
          const target = folderList.find((folder) => folder.metadata.name === (path?.[0] ?? name));
          if (target) {
            setActiveDialog({
              type: 'editFolder',
              target,
              availableDashboards: dashboardsMap.get(project) ?? new Map(),
              path: [...(path ?? []), name].slice(1),
            });
          }
          break;
        }
        case 'addFolder': {
          const target = folderList.find((folder) => folder.metadata.name === (path?.[0] ?? name));
          if (target) {
            setActiveDialog({
              type: 'addFolder',
              target,
              availableDashboards: dashboardsMap.get(project) ?? new Map(),
              path: [...(path ?? []), name].slice(1),
            });
          }
          break;
        }
        case 'deleteFolder': {
          const target = folderList.find((folder) => folder.metadata.name === (path?.[0] ?? name));
          if (!target) break;
          setActiveDialog({
            type: 'deleteFolder',
            target: target,
            path: [...(path ?? []), name].slice(1),
          });
          break;
        }
      }
    },
    [dashboardsMap, folderList]
  );

  const handleRenameButtonClick = openDialog('editDashboard');
  const handleDuplicateButtonClick = openDialog('duplicateDashboard');
  const handleDeleteButtonClick = openDialog('deleteDashboard');
  const handleEditFolderButtonClick = openDialog('editFolder');
  const handleAddFolderButtonClick = openDialog('addFolder');
  const handleDeleteFolderButtonClick = openDialog('deleteFolder');

  const closeDialog = useCallback(() => setActiveDialog({ type: 'none' }), []);

  const handleDashboardDuplication = useCallback(
    (dashboardInfo: DashboardSelector | EphemeralDashboardInfo) => {
      if (activeDialog.type === 'duplicateDashboard') {
        const targetedDashboard = activeDialog.target;
        if ('ttl' in dashboardInfo) {
          navigate(`/projects/${targetedDashboard.metadata.project}/ephemeraldashboard/new`, {
            state: {
              name: dashboardInfo.dashboard,
              spec: {
                ...targetedDashboard.spec,
                ttl: dashboardInfo.ttl,
                display: { name: dashboardInfo.dashboard },
              },
            },
          });
        } else {
          navigate(`/projects/${targetedDashboard.metadata.project}/dashboard/new`, {
            state: {
              name: dashboardInfo.dashboard,
              spec: {
                ...targetedDashboard.spec,
                display: { name: dashboardInfo.dashboard },
              },
            },
          });
        }
      }
    },
    [navigate, activeDialog]
  );

  const handleDashboardDelete = useCallback(
    (dashboard: DashboardResource): Promise<void> =>
      new Promise((resolve, reject) => {
        deleteDashboardMutation.mutate(dashboard, {
          onSuccess: (deletedDashboard: DashboardResource) => {
            successSnackbar(`Dashboard ${getResourceExtendedDisplayName(deletedDashboard)} was successfully deleted`);
            resolve();
          },
          onError: (err) => {
            exceptionSnackbar(err);
            reject();
            throw err;
          },
        });
      }),
    [exceptionSnackbar, successSnackbar, deleteDashboardMutation]
  );

  return (
    <Stack width="100%">
      {viewMode === 'tree' ? (
        <DashboardTreeList
          folderList={folderList}
          dashboardsMap={dashboardsMap}
          handleRenameButtonClick={handleRenameButtonClick}
          handleDuplicateButtonClick={handleDuplicateButtonClick}
          handleDeleteButtonClick={handleDeleteButtonClick}
          handleEditFolderButtonClick={handleEditFolderButtonClick}
          handleAddFolderButtonClick={handleAddFolderButtonClick}
          handleDeleteFolderButtonClick={handleDeleteFolderButtonClick}
          isLoading={isLoading}
        />
      ) : (
        <Card>
          <DashboardFlatList
            dashboardList={dashboardList}
            handleRenameButtonClick={handleRenameButtonClick}
            handleDuplicateButtonClick={handleDuplicateButtonClick}
            handleDeleteButtonClick={handleDeleteButtonClick}
            initialState={initialState}
            hideToolbar={hideToolbar}
            isLoading={isLoading}
          />
        </Card>
      )}
      {activeDialog.type === 'editDashboard' && (
        <EditDashboardDialog
          open={activeDialog.type === 'editDashboard'}
          dashboard={activeDialog.target}
          onClose={closeDialog}
        />
      )}
      {activeDialog.type === 'duplicateDashboard' && (
        <CreateDashboardDialog
          open={activeDialog.type === 'duplicateDashboard'}
          projects={[{ kind: 'Project', metadata: { name: activeDialog.target.metadata.project }, spec: {} }]}
          hideProjectSelect={true}
          mode="duplicate"
          name={getResourceDisplayName(activeDialog.target)}
          onSuccess={handleDashboardDuplication}
          onClose={closeDialog}
          isEphemeralDashboardEnabled={isEphemeralDashboardEnabled}
        />
      )}
      {activeDialog.type === 'deleteDashboard' && (
        <DeleteResourceDialog
          open={activeDialog.type === 'deleteDashboard'}
          resource={activeDialog.target}
          onSubmit={(v) => handleDashboardDelete(v).then(closeDialog)}
          onClose={closeDialog}
        />
      )}
      {activeDialog.type === 'editFolder' && (
        <EditFolderDialog
          open={activeDialog.type === 'editFolder'}
          folder={activeDialog.target}
          dashboards={activeDialog.availableDashboards}
          path={activeDialog.path}
          onClose={closeDialog}
          onSuccess={closeDialog}
        />
      )}
      {activeDialog.type === 'addFolder' && (
        <AddFolderDialog
          open={activeDialog.type === 'addFolder'}
          folder={activeDialog.target}
          dashboards={activeDialog.availableDashboards}
          path={activeDialog.path}
          onClose={closeDialog}
          onSuccess={closeDialog}
        />
      )}
      {activeDialog.type === 'deleteFolder' && (
        <DeleteFolderDialog
          open={activeDialog.type === 'deleteFolder'}
          folder={activeDialog.target}
          path={activeDialog.path}
          onClose={closeDialog}
        />
      )}
    </Stack>
  );
}
