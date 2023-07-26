<template>
  <div>
    <NH1>First request:</NH1>
    <ShowAllResources />
  </div>
</template>

<script setup lang="ts">
import { NH1 } from 'naive-ui';
import { useHeader } from '~/composables/useHeader';

const { title } = useHeader();
title.value = 'empty page';
</script>
