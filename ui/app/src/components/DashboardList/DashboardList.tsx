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
import { Stack } from '@mui/material';
import { ReactElement, useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from '@perses-dev/components';
import { GridInitialStateCommunity } from '@mui/x-data-grid/models/gridStateCommunity';
import { useDeleteDashboardMutation } from '../../model/dashboard-client';
import { ListProperties } from '../list';
import { CreateDashboardDialog, DeleteResourceDialog, EditDashboardDialog } from '../dialogs';
import DashboardTreeList from './DashboardTreeList';
import { DashboardFlatList } from './DashboardFlatList';

export interface DashboardListProperties extends ListProperties {
  dashboardList: DashboardResource[];
  folderList: FolderResource[];
  isEphemeralDashboardEnabled: boolean;
  viewMode?: 'flat' | 'tree';
  treeHeight?: number;
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
type ActiveDialog = 'rename' | 'duplicate' | 'delete' | null;

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
    treeHeight = 500,
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

  const [targetedDashboard, setTargetedDashboard] = useState<DashboardResource>();
  const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);

  const openDialog = useCallback(
    (dialog: ActiveDialog) => (project: string, name: string) => (): void => {
      setTargetedDashboard(dashboardsMap.get(project)?.get(name));
      setActiveDialog(dialog);
    },
    [dashboardsMap]
  );

  const handleRenameButtonClick = openDialog('rename');
  const handleDuplicateButtonClick = openDialog('duplicate');
  const handleDeleteButtonClick = openDialog('delete');

  const closeDialog = useCallback(() => setActiveDialog(null), []);

  const handleDashboardDuplication = useCallback(
    (dashboardInfo: DashboardSelector | EphemeralDashboardInfo) => {
      if (targetedDashboard) {
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
    [navigate, targetedDashboard]
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
          isLoading={isLoading}
          height={treeHeight}
        />
      ) : (
        <DashboardFlatList
          dashboardList={dashboardList}
          handleRenameButtonClick={handleRenameButtonClick}
          handleDuplicateButtonClick={handleDuplicateButtonClick}
          handleDeleteButtonClick={handleDeleteButtonClick}
          initialState={initialState}
          hideToolbar={hideToolbar}
          isLoading={isLoading}
        />
      )}
      {targetedDashboard && (
        <>
          <EditDashboardDialog open={activeDialog === 'rename'} dashboard={targetedDashboard} onClose={closeDialog} />
          <CreateDashboardDialog
            open={activeDialog === 'duplicate'}
            projects={[{ kind: 'Project', metadata: { name: targetedDashboard.metadata.project }, spec: {} }]}
            hideProjectSelect={true}
            mode="duplicate"
            name={getResourceDisplayName(targetedDashboard)}
            onSuccess={handleDashboardDuplication}
            onClose={closeDialog}
            isEphemeralDashboardEnabled={isEphemeralDashboardEnabled}
          />
          <DeleteResourceDialog
            open={activeDialog === 'delete'}
            resource={targetedDashboard}
            onSubmit={(v) => handleDashboardDelete(v).then(closeDialog)}
            onClose={closeDialog}
          />
        </>
      )}
    </Stack>
  );
}
