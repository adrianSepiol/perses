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

import { fetchJson, FolderResource, StatusError } from '@perses-dev/core';
import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import buildURL from './url-builder';
import { HTTPHeader, HTTPMethodGET } from './http';

export const resource: string = 'folders' as const;

type FolderListOptions = Omit<UseQueryOptions<FolderResource[], StatusError>, 'queryKey' | 'queryFn'> & {
  /**
   * Name prefix to filter the list of folders.
   */
  name?: string;
  /**
   * Project to filter the list of folders.
   */
  project?: string;
  metadataOnly?: boolean;
};

export function useFolderList(options: FolderListOptions): UseQueryResult<FolderResource[], StatusError> {
  const { project, metadataOnly, name, ...restOptions } = options;
  return useQuery<FolderResource[], StatusError>({
    queryKey: [resource, project, metadataOnly],
    queryFn: () => {
      return getFolders(options.project, options.metadataOnly, name);
    },
    ...restOptions,
  });
}
export function getFolders(project?: string, metadataOnly: boolean = false, name?: string): Promise<FolderResource[]> {
  const queryParams = new URLSearchParams();
  if (metadataOnly) {
    queryParams.set('metadata_only', 'true');
  }
  if (name) {
    queryParams.set('name', name);
  }
  const url = buildURL({ resource: resource, project: project, queryParams: queryParams });
  return fetchJson<FolderResource[]>(url, {
    method: HTTPMethodGET,
    headers: HTTPHeader,
  });
}
