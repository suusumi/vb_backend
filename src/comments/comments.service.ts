import {Injectable, NotFoundException} from '@nestjs/common';
import {ElasticsearchService} from '@nestjs/elasticsearch';

const availableFilters = [
    'postId', 'id', 'email', 'name', 'body'
]

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
                if (availableFilters.includes(field)) {
                    must.push({match_phrase: {[field]: value}});
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
        const response = await this.elasticsearchService.search({
            index: 'comments',
            size: 1,
            query: {
                bool: {
                    must: [
                        {match_phrase: {id}},
                    ],
                },
            },
        });

        if (response.hits.hits.length === 0) {
            throw new NotFoundException('Comment not found');
        }

        return response.hits.hits[0]._source;
    }

}
