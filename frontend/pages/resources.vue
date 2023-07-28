<template>
  <div>
    <NH1>Available Resources:</NH1>
    <ShowAllResources />
  </div>
</template>

<script setup lang="ts">
import { NH1 } from 'naive-ui';
import { useHeader } from '~/composables/useHeader';

const { title } = useHeader();
title.value = 'Resources';
</script>
