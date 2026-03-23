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

import { z } from 'zod';

export const editFolderDialogValidationSchema = z.object({
  selectedDashboards: z
    .array(
      z.object({
        name: z.string(),
        label: z.string(),
      })
    )
    .min(1, 'You must select at least one dashboard'),
  name: z.string().min(1, 'Name is required'),
});

export const createFolderDialogValidationSchema = z.object({
  selectedDashboards: z.array(
    z.object({
      name: z.string(),
      label: z.string(),
    })
  ),
  name: z.string().min(1, 'Name is required'),
});

export type EditFolderValidationType = z.infer<typeof editFolderDialogValidationSchema>;
export type CreateFolderValidationType = z.infer<typeof createFolderDialogValidationSchema>;
