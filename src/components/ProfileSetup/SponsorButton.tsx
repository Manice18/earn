import { Alert, AlertIcon, Button } from '@chakra-ui/react';
import axios from 'axios';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { BsBriefcaseFill } from 'react-icons/bs';

import { SponsorStore } from '@/store/sponsor';
import { useUser } from '@/store/user';

export function SponsorButton() {
  const router = useRouter();
  const { setCurrentSponsor } = SponsorStore();
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [showMessage, setShowMessage] = useState(false);

  const checkSponsor = async () => {
    if (!user || !user?.id) {
      setShowMessage(true);
    } else {
      setShowMessage(false);
      setIsLoading(true);
      try {
        const sponsors = await axios.get('/api/user-sponsors');
        if (sponsors?.data?.length) {
          setCurrentSponsor(sponsors?.data[0]?.sponsor);
          router.push('/new/listing');
        } else {
          router.push('/new/sponsor');
        }
      } catch (error) {
        setIsLoading(false);
      }
    }
  };

  return (
    <>
      {!!showMessage && (
        <Alert mb={4} status="warning">
          <AlertIcon />
          Please log in to continue!
        </Alert>
      )}
      <Button
        w={'full'}
        h={12}
        color={'white'}
        fontSize={'0.9rem'}
        bg={'#6562FF'}
        _hover={{ bg: '#6562FF' }}
        isLoading={!!isLoading}
        leftIcon={<BsBriefcaseFill />}
        loadingText="Redirecting..."
        onClick={() => checkSponsor()}
      >
        Make Your Sponsor Profile
      </Button>
    </>
  );
}
