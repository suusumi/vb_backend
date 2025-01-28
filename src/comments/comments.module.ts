import { Module } from '@nestjs/common';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ElasticsearchModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        node: configService.get<string>('ELASTICSEARCH_NODE') || 'http://localhost:9200',
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}