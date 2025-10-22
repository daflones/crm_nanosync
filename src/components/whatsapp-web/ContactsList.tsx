import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Users, 
  Search, 
  MessageSquare, 
  Phone, 
  User,
  UserCheck,
  UserX,
  RefreshCw,
  Send
} from 'lucide-react'
import type { WhatsAppContact } from '@/hooks/useWhatsAppWeb'

interface ContactsListProps {
  contacts: WhatsAppContact[]
  onSendMessage: (to: string, message: string) => void
  onRefresh: () => void
}

export function ContactsList({ contacts, onSendMessage, onRefresh }: ContactsListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedContact, setSelectedContact] = useState<WhatsAppContact | null>(null)
  const [messageText, setMessageText] = useState('')
  const [showMessageDialog, setShowMessageDialog] = useState(false)

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (contact.number && contact.number.includes(searchTerm)) ||
    (contact.displayNumber && contact.displayNumber.includes(searchTerm))
  )

  const myContacts = filteredContacts.filter(contact => contact.isMyContact)
  const groups = filteredContacts.filter(contact => contact.isGroup)
  const otherUsers = filteredContacts.filter(contact => !contact.isMyContact && !contact.isGroup)

  const handleSendMessage = () => {
    if (selectedContact && messageText.trim()) {
      onSendMessage(selectedContact.id, messageText.trim())
      setMessageText('')
      setShowMessageDialog(false)
      setSelectedContact(null)
    }
  }

  const openMessageDialog = (contact: WhatsAppContact) => {
    setSelectedContact(contact)
    setShowMessageDialog(true)
  }

  const ContactItem = ({ contact }: { contact: WhatsAppContact }) => (
    <div className="mx-2 p-4 rounded-xl hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 transition-all duration-200 border border-transparent hover:border-purple-100 hover:shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white font-semibold shadow-sm ${
            contact.isGroup 
              ? 'bg-gradient-to-br from-indigo-500 to-purple-600' 
              : contact.isMyContact
              ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
              : 'bg-gradient-to-br from-slate-500 to-gray-600'
          }`}>
            {contact.isGroup ? (
              <Users className="w-5 h-5" />
            ) : (
              contact.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-slate-800">{contact.name}</h4>
            <p className="text-sm text-slate-500">{contact.displayNumber || contact.number}</p>
            <div className="mt-2">
              {contact.isGroup && (
                <Badge className="bg-indigo-100 text-indigo-700 text-xs border-0">Grupo</Badge>
              )}
              {contact.isMyContact && !contact.isGroup && (
                <Badge className="bg-emerald-100 text-emerald-700 text-xs border-0">Meu Contato</Badge>
              )}
              {!contact.isMyContact && !contact.isGroup && (
                <Badge className="bg-slate-100 text-slate-600 text-xs border-0">Usuário WhatsApp</Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openMessageDialog(contact)}
            className="hover:bg-purple-100 hover:text-purple-700"
          >
            <MessageSquare className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header e Busca */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-800">Contatos</h3>
                <p className="text-sm text-slate-500 font-normal">{contacts.length} contatos encontrados</p>
              </div>
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRefresh}
              className="border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 w-4 h-4" />
            <Input
              placeholder="Buscar contatos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-slate-200 focus:border-purple-300 focus:ring-purple-200 rounded-xl"
            />
          </div>
        </CardContent>
      </Card>

      {/* Meus Contatos */}
      {myContacts.length > 0 && (
        <Card className="border-0 shadow-md bg-gradient-to-br from-white to-emerald-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <UserCheck className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-slate-800">Meus Contatos</h4>
                <p className="text-sm text-slate-500 font-normal">{myContacts.length} contatos</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ScrollArea className="h-[400px]">
              <div className="space-y-1">
                {myContacts.map((contact) => (
                  <ContactItem key={contact.id} contact={contact} />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Grupos */}
      {groups.length > 0 && (
        <Card className="border-0 shadow-md bg-gradient-to-br from-white to-indigo-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-slate-800">Grupos</h4>
                <p className="text-sm text-slate-500 font-normal">{groups.length} grupos</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ScrollArea className="h-[400px]">
              <div className="space-y-1">
                {groups.map((contact) => (
                  <ContactItem key={contact.id} contact={contact} />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Outros Usuários */}
      {otherUsers.length > 0 && (
        <Card className="border-0 shadow-md bg-gradient-to-br from-white to-slate-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-500 to-gray-600 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-slate-800">Outros Usuários</h4>
                <p className="text-sm text-slate-500 font-normal">{otherUsers.length} usuários</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ScrollArea className="h-[400px]">
              <div className="space-y-1">
                {otherUsers.map((contact) => (
                  <ContactItem key={contact.id} contact={contact} />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Estado vazio */}
      {filteredContacts.length === 0 && (
        <Card className="border-0 shadow-md">
          <CardContent className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-slate-800">Nenhum contato encontrado</h3>
            <p className="text-slate-500">
              {searchTerm ? 'Tente uma busca diferente' : 'Nenhum contato disponível'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Dialog para enviar mensagem */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-600" />
              Enviar Mensagem
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedContact && (
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-100">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-semibold shadow-sm ${
                  selectedContact.isGroup 
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600' 
                    : 'bg-gradient-to-br from-purple-500 to-pink-500'
                }`}>
                  {selectedContact.isGroup ? (
                    <Users className="w-6 h-6" />
                  ) : (
                    selectedContact.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">{selectedContact.name}</h4>
                  <p className="text-sm text-slate-500">{selectedContact.displayNumber || selectedContact.number}</p>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Mensagem</label>
              <textarea
                className="w-full p-3 border border-slate-200 rounded-xl resize-none focus:border-purple-300 focus:ring-purple-200 focus:ring-2"
                rows={4}
                placeholder="Digite sua mensagem..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowMessageDialog(false)}
                className="border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSendMessage} 
                disabled={!messageText.trim()}
                className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 shadow-md"
              >
                <Send className="w-4 h-4 mr-2" />
                Enviar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
