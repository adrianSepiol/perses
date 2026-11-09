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

package config

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestFrontend_VerifyRepeatVariableMaxValuesNegative(t *testing.T) {
	f := &Frontend{RepeatVariableMaxValues: -1}
	assert.Error(t, f.Verify())
}

func TestFrontend_VerifyRepeatVariableMaxValuesZero(t *testing.T) {
	f := &Frontend{RepeatVariableMaxValues: 0}
	assert.NoError(t, f.Verify())
}

func TestFrontend_VerifyRepeatVariableMaxValuesPositive(t *testing.T) {
	f := &Frontend{RepeatVariableMaxValues: 10}
	assert.NoError(t, f.Verify())
}
