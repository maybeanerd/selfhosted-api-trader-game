import { Controller, Get } from '@nestjs/common';

import { InstanceInfoDto } from './dto/InstanceInfo.dto';
import { serverInfo } from '@/config/serverInfo';

@Controller({ path: 'instance', version: '1' })
export class InstanceInfoController {
  @Get()
  getInstanceInfo(): InstanceInfoDto {
    return {
      domain: serverInfo.baseUrl,
      title: serverInfo.name,
      description: serverInfo.description,
      version: serverInfo.version,
      sourceUrl: serverInfo.sourceUrl,
    };
  }
}
