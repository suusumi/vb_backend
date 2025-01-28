import { Controller, Get, Query, Param } from '@nestjs/common';
import { CommentsService } from './comments.service';

@Controller('comments')
export class CommentsController {
    constructor(private readonly commentsService: CommentsService) {}

    @Get()
    async getComments(
        @Query('search') search?: string,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
        @Query() filters: Record<string, any> = {},
    ) {
        if (search) {
            return this.commentsService.searchComments(search, page, limit);
        }
        return this.commentsService.getAllComments(filters, page, limit);
    }

    @Get(':id')
    async getCommentById(@Param('id') id: string) {
        return this.commentsService.getCommentById(id);
    }
}