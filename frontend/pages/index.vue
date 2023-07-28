<template>
  <div>
    <NH1>Home</NH1>
  </div>
</template>

<script setup lang="ts">
import { NH1 } from 'naive-ui';
import { useHeader } from '~/composables/useHeader';

const { title } = useHeader();
title.value = 'Home';
</script>
