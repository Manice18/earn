import { Button, Flex, Tooltip, useDisclosure } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { usePostHog } from 'posthog-js/react';
import React, { useState } from 'react';
import { LuPencil } from 'react-icons/lu';

import { SurveyModal } from '@/components/Survey';
import { AuthWrapper } from '@/features/auth';
import {
  getListingDraftStatus,
  getRegionTooltipLabel,
  isDeadlineOver,
  type Listing,
  userRegionEligibilty,
} from '@/features/listings';
import { useUser } from '@/store/user';

import { userSubmissionQuery } from '../../queries/user-submission-status';
import { WarningModal } from '../WarningModal';
import { EasterEgg } from './EasterEgg';
import { SubmissionModal } from './SubmissionModal';

interface Props {
  listing: Listing;
  hasHackathonStarted: boolean;
}

export const SubmissionActionButton = ({
  listing,
  hasHackathonStarted,
}: Props) => {
  const {
    id,
    status,
    isPublished,
    deadline,
    region,
    type,
    isWinnersAnnounced,
  } = listing;

  const [isEasterEggOpen, setEasterEggOpen] = useState(false);
  const { user } = useUser();

  const isUserEligibleByRegion = userRegionEligibilty(region, user?.location);

  const { data: submissionStatus, isLoading: isUserSubmissionLoading } =
    useQuery(userSubmissionQuery(id!, user?.id));

  const isSubmitted = submissionStatus?.isSubmitted ?? false;

  const posthog = usePostHog();

  const { isOpen, onOpen, onClose } = useDisclosure();

  const {
    isOpen: warningIsOpen,
    onOpen: warningOnOpen,
    onClose: warningOnClose,
  } = useDisclosure();

  const regionTooltipLabel = getRegionTooltipLabel(region);

  const bountyDraftStatus = getListingDraftStatus(status, isPublished);

  const pastDeadline = isDeadlineOver(deadline) || isWinnersAnnounced;
  const buttonState = getButtonState();

  const handleSubmit = () => {
    if (isAuthenticated) {
      if (!user?.isTalentFilled) {
        warningOnOpen();
      } else {
        if (buttonState === 'submit') {
          posthog.capture('start_submission');
        } else if (buttonState === 'edit') {
          posthog.capture('edit_submission');
        }
        onOpen();
      }
    }
  };

  const isProject = type === 'project';

  let buttonText;
  let buttonBG;
  let buttonTextColor;
  let isBtnDisabled;
  let btnLoadingText;

  function getButtonState() {
    if (isSubmitted && !pastDeadline) return 'edit';
    if (isSubmitted && pastDeadline) return 'submitted';
    return 'submit';
  }

  switch (buttonState) {
    case 'edit':
      buttonText = isProject ? 'Edit Application' : 'Edit Submission';
      isBtnDisabled = false;
      btnLoadingText = null;
      break;

    case 'submitted':
      buttonText = isProject
        ? 'Applied Successfully'
        : 'Submitted Successfully';
      buttonBG = 'green.500';
      isBtnDisabled = true;
      btnLoadingText = null;
      break;

    default:
      buttonText = isProject ? 'Apply Now' : 'Submit Now';
      buttonBG = 'brand.purple';
      isBtnDisabled = Boolean(
        pastDeadline ||
          (user?.id &&
            user?.isTalentFilled &&
            (bountyDraftStatus === 'DRAFT' ||
              !hasHackathonStarted ||
              !isUserEligibleByRegion)),
      );
      btnLoadingText = 'Checking Submission..';
  }
  if (isDeadlineOver(deadline) && !isWinnersAnnounced) {
    buttonText = 'Submissions in Review';
    buttonBG = 'gray.500';
  } else if (isWinnersAnnounced) {
    buttonText = 'Winners Announced';
    buttonBG = 'gray.500';
  }

  const {
    isOpen: isSurveyOpen,
    onOpen: onSurveyOpen,
    onClose: onSurveyClose,
  } = useDisclosure();

  const surveyId = '018c6743-c893-0000-a90e-f35d31c16692';

  const { status: authStatus } = useSession();

  const isAuthenticated = authStatus === 'authenticated';

  return (
    <>
      {isOpen && (
        <SubmissionModal
          id={id}
          onClose={onClose}
          isOpen={isOpen}
          editMode={buttonState === 'edit'}
          listing={listing}
          showEasterEgg={() => setEasterEggOpen(true)}
          onSurveyOpen={onSurveyOpen}
        />
      )}
      {isSurveyOpen &&
        (!user?.surveysShown || !(surveyId in user.surveysShown)) && (
          <SurveyModal
            isOpen={isSurveyOpen}
            onClose={onSurveyClose}
            surveyId={surveyId}
          />
        )}
      {warningIsOpen && (
        <WarningModal
          onCTAClick={() => posthog.capture('complete profile_CTA pop up')}
          isOpen={warningIsOpen}
          onClose={warningOnClose}
          title={'Complete your profile'}
          bodyText={
            'Please complete your profile before submitting to a bounty.'
          }
          primaryCtaText={'Complete Profile'}
          primaryCtaLink={'/new/talent'}
        />
      )}
      {isEasterEggOpen && (
        <EasterEgg
          isOpen={isEasterEggOpen}
          onClose={() => setEasterEggOpen(false)}
          isProject={isProject}
        />
      )}
      <Image
        // Hack to show GIF Immediately when Easter Egg is visible
        src="/assets/memes/JohnCenaVibingToCupid.gif"
        alt="John Cena Vibing to Cupid"
        style={{
          width: '100%',
          marginTop: 'auto',
          display: 'block',
          visibility: 'hidden',
          position: 'fixed',
          zIndex: -99999,
          top: '-300%',
          left: '-300%',
        }}
        width="500"
        height="600"
        priority
        loading="eager"
        quality={80}
      />
      <Tooltip
        bg="brand.slate.500"
        hasArrow
        isDisabled={
          !user?.id ||
          !user?.isTalentFilled ||
          isUserEligibleByRegion ||
          pastDeadline
        }
        label={!isUserEligibleByRegion ? regionTooltipLabel : ''}
        rounded="md"
      >
        <Flex
          className="ph-no-capture"
          pos={{ base: 'fixed', md: 'static' }}
          zIndex={999}
          bottom={0}
          left="50%"
          w="full"
          px={{ base: 3, md: 0 }}
          py={{ base: 4, md: 0 }}
          bg="white"
          transform={{ base: 'translateX(-50%)', md: 'none' }}
        >
          <AuthWrapper style={{ w: 'full' }}>
            <Button
              gap={4}
              w={'full'}
              mb={{ base: 12, md: 5 }}
              textColor={buttonTextColor}
              bg={buttonBG}
              _hover={{ bg: buttonBG }}
              _disabled={{
                opacity: { base: '96%', md: '70%' },
              }}
              isDisabled={isBtnDisabled}
              isLoading={isUserSubmissionLoading}
              loadingText={btnLoadingText}
              onClick={handleSubmit}
              size="lg"
              variant={buttonState === 'edit' ? 'outline' : 'solid'}
            >
              {buttonState === 'edit' && <LuPencil />}
              {buttonText}
            </Button>
          </AuthWrapper>
        </Flex>
      </Tooltip>
    </>
  );
};
