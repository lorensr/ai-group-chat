import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import OpenAiIcon from './openai-icon'

export default ({ name }: { name?: string }) => (
  <Avatar className="h-10 w-10">
    {name === 'OpenAI' ? (
      <OpenAiIcon />
    ) : (
      <AvatarFallback>{name ? name[0] : '?'}</AvatarFallback>
    )}
  </Avatar>
)
