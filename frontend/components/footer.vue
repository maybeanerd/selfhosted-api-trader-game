<template>
  <div class="text-center text-xs border-t-[1px] border-gray-700 p-2">
    commit
    <CustomLink :url="getLinkToCommit(commitHash)">
      {{ commitHash }}
    </CustomLink><br>
    built on
    {{ buildDate.toLocaleDateString('de-DE') }}
  </div>
</template>

<script setup lang="ts">
import { getLinkToCommit } from '~/utils/gitHubRepo';

const runtimeConfig = useRuntimeConfig();

const { commitHash } = runtimeConfig.public;
const buildDate = new Date(runtimeConfig.public.buildDate);
</script>
