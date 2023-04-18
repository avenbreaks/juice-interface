import { Trans } from '@lingui/macro'
import ExternalLink from 'components/ExternalLink'
import Image from 'next/image'
import { AboutButton } from './Button'
import { SectionContainer } from './SectionContainer'

export const JuiceboxDaoSection = () => {
  return (
    <SectionContainer className="md:flex md:items-center md:justify-between md:text-start">
      <div className="md:w-1/2">
        <h2 className="font-header text-3xl md:text-4xl">Juicebox DAO</h2>
        <p className="text-base text-grey-700 dark:text-slate-200 md:text-lg">
          <Trans>
            JuiceboxDAO is a community of passionate builders, creators, and
            innovators working together to push the boundaries of decentralized
            funding. Using the Juicebox protocol, we've created a DAO to
            coordinate thousands of JBX holders, build in the open, and govern
            the protocol over time.
          </Trans>
        </p>

        <ExternalLink href="https://discord.gg/wFTh4QnDzk">
          <AboutButton>
            <Trans>Join our Discord</Trans>
          </AboutButton>
        </ExternalLink>
      </div>

      <div className="mx-auto mt-14 w-full max-w-sm md:order-1 md:mx-0 md:mt-0">
        <Image
          src={'/assets/about/illustration3.svg'}
          alt="Banny and the crew gettin' lit in the Juicebox DAO band"
          width={380}
          height={380}
          layout="responsive"
        />
      </div>
    </SectionContainer>
  )
}