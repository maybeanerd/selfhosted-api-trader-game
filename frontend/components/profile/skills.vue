<template>
  <div>
    <NH1>Skills</NH1>
    <div>{{ props.skills }}</div>
  </div>
</template>

<script setup lang="ts">
import { NH1 } from 'naive-ui';

import type { Profile } from '~/server/profile.types';

const props = defineProps<{ skills: Profile['skills'] }>();
</script>
