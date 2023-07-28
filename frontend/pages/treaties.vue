<template>
  <div>
    <NH1>Available Treaties:</NH1>
    <ShowAllTreaties />
  </div>
</template>

<script setup lang="ts">
import { NH1 } from 'naive-ui';
import { useHeader } from '~/composables/useHeader';

const { title } = useHeader();
title.value = 'Treaties';
</script>
