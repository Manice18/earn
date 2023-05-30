import { promises as fs } from 'fs';
import type { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';

import { prisma } from '@/prisma';

export default async function user(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const jsonDirectory = path.join(process.cwd(), '/public/assets/data');
    const bountiesTemplatesString = await fs.readFile(
      `${jsonDirectory}/bountiesTemplates.json`,
      'utf8'
    );
    const bountiesTemplatesParsed = JSON.parse(
      bountiesTemplatesString as unknown as string
    );

    bountiesTemplatesParsed.map(async (bountyTemplate: any, i: number) => {
      console.log('Adding ', i);
      await prisma.bountiesTemplates.create({
        data: {
          templateTitle: bountyTemplate.templateTitle,
          title: bountyTemplate.title,
          slug: bountyTemplate.slug,
          description: bountyTemplate.description,
          skills: bountyTemplate.skills,
        },
      });
      console.log('Successfully Added', i);
      return i;
    });
    res.status(200).json(bountiesTemplatesParsed?.length);
  } catch (error) {
    console.log('file: create.ts:29 ~ user ~ error:', error);
    res.status(400).json({
      error,
      message: 'Error occurred while adding a new sponsor.',
    });
  }
}
