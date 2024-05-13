import nock from 'nock';
import {
  ContentfulResult,
  FEATURE_ANNOUNCEMENT_URL,
} from '../services/feature-announcements';
import { FeatureAnnouncementRawNotification } from '../types/feature-announcement/feature-announcement';
import { TRIGGER_TYPES } from '../constants/notification-schema';

type MockReply = {
  status: nock.StatusCode;
  body?: nock.Body;
};

export function mockFetchFeatureAnnouncementNotifications(
  mockReply?: MockReply,
) {
  const reply = mockReply ?? { status: 200, body: { items: [] } };
  const mockEndpoint = nock(FEATURE_ANNOUNCEMENT_URL)
    .get('')
    .query(true)
    .reply(reply.status, reply.body);

  return mockEndpoint;
}

export function createMockFeatureAnnouncementAPIResult(): ContentfulResult {
  return {
    sys: {
      type: 'Array',
    },
    total: 17,
    skip: 0,
    limit: 1,
    items: [
      {
        metadata: {
          tags: [],
        },
        sys: {
          space: {
            sys: {
              type: 'Link',
              linkType: 'Space',
              id: 'jdkgyfmyd9sw',
            },
          },
          id: '1ABRmHaNCgmxROKXXLXsMu',
          type: 'Entry',
          createdAt: '2024-04-09T13:24:01.872Z',
          updatedAt: '2024-04-09T13:24:01.872Z',
          environment: {
            sys: {
              id: 'master',
              type: 'Link',
              linkType: 'Environment',
            },
          },
          revision: 1,
          contentType: {
            sys: {
              type: 'Link',
              linkType: 'ContentType',
              id: 'productAnnouncement',
            },
          },
          locale: 'en-US',
        },
        fields: {
          title: 'Don’t miss out on airdrops and new NFT mints!',
          id: 'dont-miss-out-on-airdrops-and-new-nft-mints',
          category: 'ANNOUNCEMENT',
          shortDescription:
            'Check your airdrop eligibility and see trending NFT drops. Head over to the Explore tab to get started. ',
          image: {
            sys: {
              type: 'Link',
              linkType: 'Asset',
              id: '5jqq8sFeLc6XEoeWlpI3aB',
            },
          },
          longDescription: {
            data: {},
            content: [
              {
                data: {},
                content: [
                  {
                    data: {},
                    marks: [],
                    value:
                      'You can now verify if any of your connected addresses are eligible for airdrops and other ERC-20 claims in a secure and convenient way. We’ve also added trending NFT mints based on creators you’ve minted from before or other tokens you hold. Head over to the Explore tab to get started. \n',
                    nodeType: 'text',
                  },
                ],
                nodeType: 'paragraph',
              },
            ],
            nodeType: 'document',
          },
          link: {
            sys: {
              type: 'Link',
              linkType: 'Entry',
              id: '62xKYM2ydo4F1mS5q97K5q',
            },
          },
        },
      },
    ],
    includes: {
      Entry: [
        {
          metadata: {
            tags: [],
          },
          sys: {
            space: {
              sys: {
                type: 'Link',
                linkType: 'Space',
                id: 'jdkgyfmyd9sw',
              },
            },
            id: '62xKYM2ydo4F1mS5q97K5q',
            type: 'Entry',
            createdAt: '2024-04-09T13:23:03.636Z',
            updatedAt: '2024-04-09T13:23:03.636Z',
            environment: {
              sys: {
                id: 'master',
                type: 'Link',
                linkType: 'Environment',
              },
            },
            revision: 1,
            contentType: {
              sys: {
                type: 'Link',
                linkType: 'ContentType',
                id: 'link',
              },
            },
            locale: 'en-US',
          },
          fields: {
            linkText: 'Try now',
            linkUrl: 'https://portfolio.metamask.io/explore',
            isExternal: false,
          },
        },
      ],
      Asset: [
        {
          metadata: {
            tags: [],
          },
          sys: {
            space: {
              sys: {
                type: 'Link',
                linkType: 'Space',
                id: 'jdkgyfmyd9sw',
              },
            },
            id: '5jqq8sFeLc6XEoeWlpI3aB',
            type: 'Asset',
            createdAt: '2024-04-09T13:23:13.327Z',
            updatedAt: '2024-04-09T13:23:13.327Z',
            environment: {
              sys: {
                id: 'master',
                type: 'Link',
                linkType: 'Environment',
              },
            },
            revision: 1,
            locale: 'en-US',
          },
          fields: {
            title: 'PDAPP notification image Airdrops & NFT mints',
            description: '',
            file: {
              url: '//images.ctfassets.net/jdkgyfmyd9sw/5jqq8sFeLc6XEoeWlpI3aB/73ee0f1afa9916c3a7538b0bbee09c26/PDAPP_notification_image_Airdrops___NFT_mints.png',
              details: {
                size: 797731,
                image: {
                  width: 2880,
                  height: 1921,
                },
              },
              fileName: 'PDAPP notification image_Airdrops & NFT mints.png',
              contentType: 'image/png',
            },
          },
        },
      ],
    },
  } as unknown as ContentfulResult;
}

export function createMockFeatureAnnouncementRaw(): FeatureAnnouncementRawNotification {
  return {
    type: TRIGGER_TYPES.FEATURES_ANNOUNCEMENT,
    createdAt: '2999-04-09T13:24:01.872Z',
    data: {
      id: 'dont-miss-out-on-airdrops-and-new-nft-mints',
      category: 'ANNOUNCEMENT',
      title: 'Don’t miss out on airdrops and new NFT mints!',
      longDescription: `<p>You can now verify if any of your connected addresses are eligible for airdrops and other ERC-20 claims in a secure and convenient way. We’ve also added trending NFT mints based on creators you’ve minted from before or other tokens you hold. Head over to the Explore tab to get started.</p>`,
      shortDescription:
        'Check your airdrop eligibility and see trending NFT drops. Head over to the Explore tab to get started.',
      image: {
        title: 'PDAPP notification image Airdrops & NFT mints',
        description: '',
        url: '//images.ctfassets.net/jdkgyfmyd9sw/5jqq8sFeLc6XEoeWlpI3aB/73ee0f1afa9916c3a7538b0bbee09c26/PDAPP_notification_image_Airdrops___NFT_mints.png',
      },
      link: {
        linkText: 'Try now',
        linkUrl: 'https://portfolio.metamask.io/explore',
        isExternal: false,
      },
    },
  };
}
