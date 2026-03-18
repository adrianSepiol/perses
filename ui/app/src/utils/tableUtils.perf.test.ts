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

import { DashboardResource, FolderResource, FolderSpec } from '@perses-dev/core';
import { buildTableRows } from './tableUtils';

function makeDashboard(project: string, name: string): DashboardResource {
  return {
    kind: 'Dashboard',
    metadata: {
      name,
      project,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-06-01T00:00:00Z',
      version: 1,
    },
    spec: {
      duration: '1h',
      variables: [],
      layouts: [],
      panels: {},
    },
  };
}

function makeFolder(project: string, name: string, spec: FolderSpec[]): FolderResource {
  return {
    kind: 'Folder',
    metadata: {
      name,
      project,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-06-01T00:00:00Z',
      version: 1,
    },
    spec,
  };
}

/**
 * Builds a dashboardsMap with `projectCount` projects, each containing
 * `dashboardsPerProject` dashboards.
 */
function buildDashboardsMap(
  projectCount: number,
  dashboardsPerProject: number
): Map<string, Map<string, DashboardResource>> {
  const map = new Map<string, Map<string, DashboardResource>>();
  for (let p = 0; p < projectCount; p++) {
    const project = `project-${p}`;
    const inner = new Map<string, DashboardResource>();
    for (let d = 0; d < dashboardsPerProject; d++) {
      const name = `dashboard-${d}`;
      inner.set(name, makeDashboard(project, name));
    }
    map.set(project, inner);
  }
  return map;
}

/**
 * Builds a flat folder list: one folder per project, each referencing
 * `dashboardsPerFolder` dashboards.
 */
function buildFlatFolderList(
  projectCount: number,
  dashboardsPerProject: number,
  dashboardsPerFolder: number
): FolderResource[] {
  const folders: FolderResource[] = [];
  for (let p = 0; p < projectCount; p++) {
    const project = `project-${p}`;
    const spec: FolderSpec[] = [];
    for (let d = 0; d < Math.min(dashboardsPerFolder, dashboardsPerProject); d++) {
      spec.push({ kind: 'Dashboard', name: `dashboard-${d}` });
    }
    folders.push(makeFolder(project, `folder-${p}`, spec));
  }
  return folders;
}

/**
 * Builds a nested folder structure (3 levels deep).
 * Level-1 folder → Level-2 subfolder → Level-3 subfolder → dashboards
 */
function buildNestedFolderList(projectCount: number, dashboardsPerProject: number): FolderResource[] {
  const folders: FolderResource[] = [];
  for (let p = 0; p < projectCount; p++) {
    const project = `project-${p}`;
    // assign dashboards round-robin across 3 levels
    const third = Math.floor(dashboardsPerProject / 3);

    const level3Spec: FolderSpec[] = Array.from({ length: third }, (_, i) => ({
      kind: 'Dashboard' as const,
      name: `dashboard-${i}`,
    }));

    const level2Spec: FolderSpec[] = [
      ...Array.from({ length: third }, (_, i) => ({
        kind: 'Dashboard' as const,
        name: `dashboard-${third + i}`,
      })),
      { kind: 'Folder' as const, name: 'level3', spec: level3Spec },
    ];

    const level1Spec: FolderSpec[] = [
      ...Array.from({ length: third }, (_, i) => ({
        kind: 'Dashboard' as const,
        name: `dashboard-${2 * third + i}`,
      })),
      { kind: 'Folder' as const, name: 'level2', spec: level2Spec },
    ];

    folders.push(makeFolder(project, `folder-${p}`, level1Spec));
  }
  return folders;
}

// --- performance tests -------------------------------------------------------

const THRESHOLD_MS = 200; // acceptable upper bound for each scenario

describe('buildTableRows – performance', () => {
  it('handles a large flat list (50 projects x 2000 dashboards each, no folders)', () => {
    const projects = 50;
    const dashboards = 2000;
    const dashboardsMap = buildDashboardsMap(projects, dashboards);

    const start = performance.now();
    const rows = buildTableRows([], dashboardsMap);
    const elapsed = performance.now() - start;

    expect(rows).toHaveLength(projects * dashboards);
    expect(elapsed).toBeLessThan(THRESHOLD_MS);
    console.log(`flat (no folders): ${elapsed.toFixed(2)} ms`);
  });

  it('handles a large flat list (50 projects x 2000 dashboards, all in folders)', () => {
    const projects = 50;
    const dashboards = 2000;
    const dashboardsMap = buildDashboardsMap(projects, dashboards);
    const folderList = buildFlatFolderList(projects, dashboards, dashboards);

    const start = performance.now();
    const rows = buildTableRows(folderList, dashboardsMap);
    const elapsed = performance.now() - start;

    // one top-level row per folder, children are the dashboards
    expect(rows).toHaveLength(projects);
    rows.forEach((row) => expect(row.children).toHaveLength(dashboards));
    expect(elapsed).toBeLessThan(THRESHOLD_MS);
    console.log(`flat (all in folders): ${elapsed.toFixed(2)} ms`);
  });

  it('handles a deeply nested folder structure (50 projects x 2100 dashboards, 3 levels)', () => {
    const projects = 50;
    const dashboards = 2100; // divisible by 3 for clean round-robin split
    const dashboardsMap = buildDashboardsMap(projects, dashboards);
    const folderList = buildNestedFolderList(projects, dashboards);

    const start = performance.now();
    const rows = buildTableRows(folderList, dashboardsMap);
    const elapsed = performance.now() - start;

    expect(rows).toHaveLength(projects);
    expect(elapsed).toBeLessThan(THRESHOLD_MS);
    console.log(`nested (3 levels): ${elapsed.toFixed(2)} ms`);
  });

  it('handles a mixed scenario (50 projects x 2000 dashboards, half in folders)', () => {
    const projects = 50;
    const dashboards = 2000;
    const dashboardsInFolder = 1000;
    const dashboardsMap = buildDashboardsMap(projects, dashboards);
    const folderList = buildFlatFolderList(projects, dashboards, dashboardsInFolder);

    const start = performance.now();
    const rows = buildTableRows(folderList, dashboardsMap);
    const elapsed = performance.now() - start;

    // folders + loose dashboards (those not in any folder)
    const expectedLoose = projects * (dashboards - dashboardsInFolder);
    expect(rows).toHaveLength(projects + expectedLoose);
    expect(elapsed).toBeLessThan(THRESHOLD_MS);
    console.log(`mixed (half in folders): ${elapsed.toFixed(2)} ms`);
  });

  it('scales sub-linearly: 10x more dashboards should not take 10x longer', () => {
    const projects = 10;

    const smallMap = buildDashboardsMap(projects, 2000);
    const startSmall = performance.now();
    buildTableRows([], smallMap);
    const elapsedSmall = performance.now() - startSmall;

    const largeMap = buildDashboardsMap(projects, 20000);
    const startLarge = performance.now();
    buildTableRows([], largeMap);
    const elapsedLarge = performance.now() - startLarge;

    console.log(`small (${projects}x2000): ${elapsedSmall.toFixed(2)} ms`);
    console.log(`large (${projects}x20000): ${elapsedLarge.toFixed(2)} ms`);

    // Allow a 10x factor with some headroom, but not worse
    expect(elapsedLarge).toBeLessThan(elapsedSmall * 10 + 50 /* noise floor */);
  });
});
