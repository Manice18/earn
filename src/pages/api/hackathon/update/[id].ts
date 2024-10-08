import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { filterAllowedFields } from '@/utils/filterAllowedFields';
import { safeStringify } from '@/utils/safeStringify';

const allowedFields = [
  'title',
  'hackathonSponsor',
  'pocId',
  'skills',
  'slug',
  'templateId',
  'pocSocials',
  'applicationType',
  'timeToComplete',
  'description',
  'type',
  'region',
  'referredBy',
  'references',
  'requirements',
  'rewardAmount',
  'rewards',
  'token',
  'compensationType',
  'minRewardAsk',
  'maxRewardAsk',
  'isPublished',
  'isPrivate',
];

async function bounty(req: NextApiRequestWithUser, res: NextApiResponse) {
  const params = req.query;
  const id = params.id as string;
  logger.debug(`Request body: ${safeStringify(req.body)}`);
  const { hackathonSponsor, ...data } = req.body;

  const updatedData = filterAllowedFields(data, allowedFields);

  try {
    const userId = req.userId;

    const user = await prisma.user.findUnique({
      where: {
        id: userId as string,
      },
    });

    if (!user) {
      return res.status(403).json({ error: 'User does not exist.' });
    }

    if (Object.keys(updatedData).length === 0) {
      logger.warn(`No valid fields provided for update for user ID: ${userId}`);
      return res
        .status(400)
        .json({ error: 'No valid fields provided for update' });
    }

    const currentBounty = await prisma.bounties.findUnique({
      where: { id },
    });

    if (!currentBounty) {
      return res
        .status(404)
        .json({ message: `Bounty with id=${id} not found.` });
    }

    if (
      user.currentSponsorId !== currentBounty?.sponsorId &&
      user.hackathonId !== currentBounty.hackathonId
    ) {
      return res.status(403).json({
        error: 'User does not match the current sponsor or hackathon ID.',
      });
    }

    const newRewardsCount = Object.keys(updatedData.rewards || {}).length;
    const currentTotalWinners = currentBounty.totalWinnersSelected || 0;

    if (newRewardsCount < currentTotalWinners) {
      updatedData.totalWinnersSelected = newRewardsCount;

      for (
        let position = newRewardsCount + 1;
        position <= currentTotalWinners;
        position++
      ) {
        await prisma.submission.updateMany({
          where: {
            listingId: id,
            isWinner: true,
            winnerPosition: position,
          },
          data: {
            isWinner: false,
            winnerPosition: null,
          },
        });
      }
    }

    const sponsorId = hackathonSponsor;
    const result = await prisma.bounties.update({
      where: { id, sponsorId },
      data: {
        sponsorId,
        ...updatedData,
      },
    });

    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      error,
      message: `Error occurred while updating bounty with id=${id}.`,
    });
  }
}

export default withAuth(bounty);
