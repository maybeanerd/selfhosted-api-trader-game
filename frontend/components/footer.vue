<template>
  <div class="text-center text-xs border-t-[1px] border-gray-700 p-2">
    client version:
    <CustomLink :url="getLinkToTag(version)">
      {{ version }}
    </CustomLink>
    <br>
    server version:
    <CustomLink v-if="serverVersion" :url="getLinkToTag(serverVersion)">
      {{ serverVersion }}
    </CustomLink>
    <span v-else>loading...</span>
    <br>
    built on
    {{ buildDate.toLocaleDateString('de-DE') }}
    (<CustomLink :url="getLinkToCommit(commitHash)">
      {{ commitHash }}
    </CustomLink>)
  </div>
</template>

<script setup lang="ts">
import { getLinkToCommit, getLinkToTag } from '~/utils/gitHubRepo';

const runtimeConfig = useRuntimeConfig();

const {
  data: nodeInfo,
} = await useFetch<{
  software: {
    name: string;
    version: string;
  };
}>('/.well-known/nodeinfo', {
  lazy: true,
  server: false,
});

const serverVersion = computed(() => nodeInfo.value?.software.version ?? null);

const { commitHash, version } = runtimeConfig.public;
const buildDate = new Date(runtimeConfig.public.buildDate);
</script>
