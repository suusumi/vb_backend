import {Injectable} from '@nestjs/common';
import {ElasticsearchService} from '@nestjs/elasticsearch';

@Injectable()
export class CommentsService {
    constructor(private readonly elasticsearchService: ElasticsearchService) {
    }

    async getAllComments(
        filters: Record<string, any>,
        page: number = 1,
        limit: number = 10,
    ) {
        const must: any[] = [];

        for (const [field, value] of Object.entries(filters)) {
            if (value) {
                if (['postId', 'id'].includes(field)) {
                    must.push({match: {[field]: value}});
                } else if (field === 'email') {
                    must.push({term: {[field]: value}});
                } else if (['name', 'body'].includes(field)) {
                    must.push({match: {[field]: value}});
                }
            }
        }

        const response = await this.elasticsearchService.search({
            index: 'comments',
            from: (page - 1) * limit,
            size: limit,
            query: {
                bool: {
                    must,
                },
            },
        });

        const totalCount =
            typeof response.hits.total === 'number'
                ? response.hits.total
                : response.hits.total?.value ?? 0;

        const totalPages = totalCount > 0 ? Math.ceil(totalCount / limit) : 1;

        return {
            comments: response.hits.hits.map((hit: any) => hit._source),
            totalPages,
            totalCount,
            currentPage: page,
        };
    }

    async searchComments(query: string, page: number = 1, limit: number = 10) {
        const response = await this.elasticsearchService.search({
            index: 'comments',
            from: (page - 1) * limit,
            size: limit,
            query: {
                multi_match: {
                    query,
                    fields: ['name', 'email', 'body'],
                },
            },
        });

        const totalCount =
            typeof response.hits.total === 'number'
                ? response.hits.total
                : response.hits.total?.value ?? 0;

        const totalPages = totalCount > 0 ? Math.ceil(totalCount / limit) : 1;

        return {
            comments: response.hits.hits.map((hit: any) => hit._source),
            totalPages,
            totalCount,
            currentPage: page,
        };
    }

    async getCommentById(id: string) {
        const response = await this.elasticsearchService.get({
            index: 'comments',
            id,
        });
        return response._source;
    }
}
