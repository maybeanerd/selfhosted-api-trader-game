<template>
  <div>
    <NH1>Projects</NH1>
    <div>{{ props.projects }}</div>
  </div>
</template>

<script setup lang="ts">
import { NH1 } from 'naive-ui';

import type { Profile } from '~/server/profile.types';

const props = defineProps<{ projects: Profile['projects'] }>();
</script>
