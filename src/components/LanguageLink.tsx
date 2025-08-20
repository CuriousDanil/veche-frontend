import { Link, type LinkProps } from 'react-router-dom'
import { useLanguage } from '../hooks/useLanguage'

type LanguageLinkProps = LinkProps & {
  to: string
}

export default function LanguageLink({ to, ...props }: LanguageLinkProps) {
  const { currentLanguage } = useLanguage()
  
  // Convert regular path to language-prefixed path
  const languagePath = to.startsWith('/') 
    ? `/${currentLanguage}${to}` 
    : `/${currentLanguage}/${to}`
  
  return <Link {...props} to={languagePath} />
}
