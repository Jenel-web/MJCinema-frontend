// Dev-only: registered in App.tsx only when import.meta.env.DEV. Not part of the production bundle.
import { useState, type ReactNode } from 'react'
import {
  Badge,
  Button,
  Card,
  CardTitle,
  Checkbox,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Input,
  Modal,
  Select,
  Skeleton,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Tabs,
  ToastCard,
  useToast,
  type ButtonSize,
  type ButtonVariant,
} from '../components/ui'
import { SearchIcon } from '../components/ui/icons'

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="border-t border-ln py-14">
      <h2 className="heading text-[40px]">{title}</h2>
      {note && <p className="mt-2 max-w-[560px] text-mu">{note}</p>}
      <div className="mt-8 flex flex-col gap-8">{children}</div>
    </section>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-3 text-[13px] font-medium text-mu">{label}</p>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  )
}

const swatches: { name: string; cls: string; hex: string }[] = [
  { name: 'bg', cls: 'bg-bg', hex: '#08080A' },
  { name: 's1', cls: 'bg-s1', hex: '#121216' },
  { name: 's2', cls: 'bg-s2', hex: '#1A1A20' },
  { name: 's3', cls: 'bg-s3', hex: '#25252D' },
  { name: 'tx', cls: 'bg-tx', hex: '#F5F5F6' },
  { name: 'mu', cls: 'bg-mu', hex: '#A6A6B0' },
  { name: 'rd', cls: 'bg-rd', hex: '#D91F27' },
  { name: 'rd2', cls: 'bg-rd2', hex: '#EF3A41' },
  { name: 'gd', cls: 'bg-gd', hex: '#E6B25D' },
  { name: 'bl', cls: 'bg-bl', hex: '#6EA8FE' },
  { name: 'ok', cls: 'bg-ok', hex: '#3ECF8E' },
  { name: 'wn', cls: 'bg-wn', hex: '#F5A524' },
  { name: 'err', cls: 'bg-err', hex: '#FF8A8F' },
]

const variants: ButtonVariant[] = ['primary', 'ghost', 'danger-soft']
const sizes: ButtonSize[] = ['sm', 'md', 'lg', 'xl']

type BookingTab = 'ACTIVE' | 'COMPLETED' | 'CANCELLED'

export default function StyleguidePage() {
  const toast = useToast()
  const [modal, setModal] = useState<'sm' | 'md' | 'lg' | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [tab, setTab] = useState<BookingTab>('ACTIVE')
  const [chip, setChip] = useState('now')
  const [remember, setRemember] = useState(true)

  return (
    <div className="page-glow min-h-screen">
      <div className="mx-auto max-w-[1280px] px-4 pb-24 sm:px-10">
        <header className="py-14">
          <h1 className="heading text-[64px] text-rd">MJCinema</h1>
          <p className="mt-3 max-w-[560px] text-mu">
            Styleguide (dev only). Every shared component in <code>components/ui</code> and its
            variants, built from <code>design/design/system/tokens.md</code>.
          </p>
        </header>

        <Section title="Color" note="Red is only for the primary action, the active state and the logo. Gold marks anything premium.">
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-5 lg:grid-cols-7">
            {swatches.map((s) => (
              <div key={s.name}>
                <div className={`${s.cls} h-14 rounded-ctl border border-ln2`} />
                <p className="mt-2 text-[13px] font-medium">{s.name}</p>
                <p className="text-xs text-mu">{s.hex}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Typography">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <p className="text-[13px] text-mu">Display: Barlow Condensed 800, uppercase</p>
              <p className="heading mt-4 text-[88px]">Now showing</p>
              <p className="heading mt-3 text-[48px]">Section heading</p>
              <p className="heading mt-3 text-[32px]">Card heading</p>
              <p className="heading mt-3 text-[24px]">Small heading</p>
            </Card>
            <Card className="flex flex-col gap-3">
              <p className="text-[13px] text-mu">Body: DM Sans 400 to 700</p>
              <p className="text-lg">Lead 18/28. A heist crew has one night to lift a painting.</p>
              <p className="text-base">Body 16/24. Pick a showtime, then choose your seats.</p>
              <p className="text-sm text-mu">Small 14/20 for metadata such as cinema, date and time.</p>
              <p className="text-[13px] text-mu">Caption 13/18 for helper text and table headers.</p>
              <p className="ticket-code">MJC-7K2Q-D6</p>
            </Card>
          </div>
        </Section>

        <Section title="Button" note="Pill radius, 150ms ease. Disabled uses --s3 with muted text.">
          {variants.map((v) => (
            <Row key={v} label={`${v}: sm 36 · md 44 · lg 48 · xl 52`}>
              {sizes.map((s) => (
                <Button key={s} variant={v} size={s}>
                  {v === 'primary' ? 'Book seats' : v === 'ghost' ? 'Watch trailer' : 'Cancel booking'}
                </Button>
              ))}
            </Row>
          ))}
          <Row label="Disabled">
            {variants.map((v) => (
              <Button key={v} variant={v} disabled>
                Disabled
              </Button>
            ))}
          </Row>
          <Row label="Loading">
            {variants.map((v) => (
              <Button key={v} variant={v} loading>
                Saving
              </Button>
            ))}
          </Row>
          <Row label="Icon only (44) and full width">
            <Button iconOnly variant="ghost" aria-label="Search">
              <SearchIcon />
            </Button>
            <div className="w-full max-w-sm">
              <Button fullWidth size="lg">
                Login
              </Button>
            </div>
          </Row>
        </Section>

        <Section title="Input" note="Focus: red border plus a 4px red halo. Error: --err border and message.">
          <div className="grid max-w-[920px] gap-6 sm:grid-cols-2">
            <Input label="Username" placeholder="Username" autoComplete="off" />
            <Input label="Password (error)" type="password" defaultValue="short" error="Password must be at least 8 characters." />
            <Input label="With hint" placeholder="mj.cortas" hint="Letters and numbers only." />
            <Input label="Disabled" placeholder="Disabled" disabled />
            <Input label="Dialog size (48)" size="md" placeholder="450" />
            <Input aria-label="Search movies" size="sm" placeholder="Search movies" leading={<SearchIcon />} />
          </div>
          <p className="text-[13px] text-mu">Sizes: lg 52 (auth, default), md 48 (dialogs), sm 44 (search).</p>
        </Section>

        <Section title="Select">
          <div className="grid max-w-[920px] gap-6 sm:grid-cols-2">
            <Select label="Movie" defaultValue="nh">
              <option value="nh">Night Harbor</option>
              <option value="dq">Deep Quiet</option>
            </Select>
            <Select label="Cinema (error)" error="Choose a cinema." defaultValue="">
              <option value="" disabled>
                Select a cinema
              </option>
              <option value="1">SM City North · Cinema 3</option>
            </Select>
            <Select label="Disabled" disabled>
              <option>Select a slot</option>
            </Select>
          </div>
        </Section>

        <Section title="Checkbox">
          <Row label="Default, checked, disabled">
            <Checkbox label="Remember me" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            <Checkbox label="Unchecked" defaultChecked={false} />
            <Checkbox label="Disabled" disabled />
            <Checkbox label="Disabled checked" disabled defaultChecked />
          </Row>
        </Section>

        <Section title="Tabs" note="Tab: segmented pill with counts (bookings). Chip: separate pills, active is red (filters). Arrow keys move between them.">
          <Row label="tab">
            <Tabs
              aria-label="Booking status"
              value={tab}
              onChange={setTab}
              items={[
                { value: 'ACTIVE', label: 'Active', count: 2 },
                { value: 'COMPLETED', label: 'Completed', count: 5 },
                { value: 'CANCELLED', label: 'Cancelled', count: 1 },
              ]}
            />
          </Row>
          <Row label="chip">
            <Tabs
              variant="chip"
              aria-label="Movie filter"
              value={chip}
              onChange={setChip}
              items={[
                { value: 'now', label: 'Now showing' },
                { value: 'soon', label: 'Coming soon' },
                { value: 'cinema', label: 'Cinema' },
              ]}
            />
          </Row>
        </Section>

        <Section title="Badge">
          <Row label="success · neutral · cancelled · warning">
            <Badge tone="success">Active</Badge>
            <Badge tone="neutral">Completed</Badge>
            <Badge tone="cancelled">Cancelled</Badge>
            <Badge tone="warning">Coming soon</Badge>
          </Row>
        </Section>

        <Section title="Card">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardTitle>Solid</CardTitle>
              <p className="mt-2 text-sm text-mu">--s1 surface, 1px --ln border, radius 16, padding 24.</p>
            </Card>
            <Card variant="glass">
              <p className="text-sm text-mu">Total sales (glass)</p>
              <p className="heading mt-3 text-[56px] text-gd">₱ 482,300</p>
              <Badge tone="success" className="mt-2">
                12% vs last week
              </Badge>
            </Card>
            <Card padding="lg">
              <CardTitle>Padding lg</CardTitle>
              <p className="mt-2 text-sm text-mu">28px, the dialog padding.</p>
            </Card>
          </div>
        </Section>

        <Section title="Table">
          <Card>
            <Table>
              <Thead>
                <tr>
                  <Th>#</Th>
                  <Th>Title</Th>
                  <Th>Rating</Th>
                  <Th>Status</Th>
                  <Th align="right">Revenue</Th>
                </tr>
              </Thead>
              <Tbody>
                <Tr>
                  <Td className="text-mu">1</Td>
                  <Td className="font-semibold">Night Harbor</Td>
                  <Td className="text-gd">★ 8.2</Td>
                  <Td>
                    <Badge tone="success">Now showing</Badge>
                  </Td>
                  <Td align="right">₱ 96,400</Td>
                </Tr>
                <Tr>
                  <Td className="text-mu">2</Td>
                  <Td className="font-semibold">Low Tide</Td>
                  <Td className="text-gd">★ 7.2</Td>
                  <Td>
                    <Badge tone="warning">Coming soon</Badge>
                  </Td>
                  <Td align="right">₱ 0</Td>
                </Tr>
                <Tr>
                  <Td className="text-mu">3</Td>
                  <Td className="font-semibold">Hollow Crown</Td>
                  <Td className="text-gd">★ 7.1</Td>
                  <Td>
                    <Badge tone="neutral">Ended</Badge>
                  </Td>
                  <Td align="right">₱ 37,600</Td>
                </Tr>
              </Tbody>
            </Table>
          </Card>
        </Section>

        <Section title="Modal" note="Esc and scrim click close (both configurable). Focus is trapped and page scroll is locked while open.">
          <Row label="Sizes: sm 460 · md 540 · lg 1040">
            <Button variant="ghost" onClick={() => setModal('sm')}>
              Open sm
            </Button>
            <Button variant="ghost" onClick={() => setModal('md')}>
              Open md
            </Button>
            <Button variant="ghost" onClick={() => setModal('lg')}>
              Open lg
            </Button>
          </Row>
          <Modal open={modal === 'sm'} onClose={() => setModal(null)} title="Small dialog" size="sm">
            <p className="mt-4 text-mu">Used for confirm and status dialogs.</p>
          </Modal>
          <Modal open={modal === 'md'} onClose={() => setModal(null)} title="Add schedule" size="md">
            <div className="mt-6 flex flex-col gap-5">
              <Select label="Movie" data-autofocus>
                <option>Night Harbor</option>
              </Select>
              <Input label="Date" type="date" size="md" />
              <div className="flex gap-3">
                <Button variant="ghost" size="lg" className="flex-1" onClick={() => setModal(null)}>
                  Cancel
                </Button>
                <Button size="lg" className="flex-1" onClick={() => setModal(null)}>
                  Add schedule
                </Button>
              </div>
            </div>
          </Modal>
          <Modal open={modal === 'lg'} onClose={() => setModal(null)} title="Movie details" size="lg" closeOnOverlay={false}>
            <p className="mt-4 text-mu">Large dialog for movie details. This one ignores scrim clicks.</p>
          </Modal>
        </Section>

        <Section title="ConfirmDialog">
          <Row label="Cancel left (ghost), confirm right (red)">
            <Button variant="ghost" onClick={() => setConfirmOpen(true)}>
              Open confirm
            </Button>
          </Row>
          <ConfirmDialog
            open={confirmOpen}
            title="Cancel this booking?"
            description="Night Harbor, Sat 31 Oct, 4:15 PM, 3 seats. ₱960 returns to your balance."
            cancelLabel="Keep booking"
            confirmLabel="Cancel booking"
            loading={confirmLoading}
            onCancel={() => setConfirmOpen(false)}
            onConfirm={() => {
              setConfirmLoading(true)
              setTimeout(() => {
                setConfirmLoading(false)
                setConfirmOpen(false)
                toast.show({ type: 'success', title: 'Booking cancelled' })
              }, 800)
            }}
          />
        </Section>

        <Section title="Toast" note="One at a time, bottom right, 5 second auto close. A new toast replaces the current one.">
          <Row label="Trigger">
            <Button variant="ghost" onClick={() => toast.show({ type: 'success', title: 'Movie added', message: 'Night Harbor is now in the Movies list.' })}>
              Show success
            </Button>
            <Button variant="danger-soft" onClick={() => toast.show({ type: 'error', title: 'Something went wrong', message: 'Please try again.' })}>
              Show error
            </Button>
          </Row>
          <Row label="Static">
            <ToastCard toast={{ type: 'success', title: 'Movie added', message: 'Night Harbor is now in the Movies list.' }} onClose={() => {}} />
            <ToastCard toast={{ type: 'error', title: 'Something went wrong', message: 'Please fill in all fields.' }} onClose={() => {}} />
          </Row>
        </Section>

        <Section title="Skeleton, EmptyState, ErrorState" note="The three states every data screen needs.">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <p className="mb-4 text-sm text-mu">Loading</p>
              <div className="grid grid-cols-3 gap-3">
                <Skeleton className="aspect-[2/3]" />
                <Skeleton className="aspect-[2/3]" />
                <Skeleton className="aspect-[2/3]" />
              </div>
              <Skeleton className="mt-4 h-4 w-2/3" />
            </Card>
            <EmptyState
              eyebrow="Empty"
              title="Nothing showing yet"
              description="No movies match this filter. Clear it to see everything."
              action={<Button variant="ghost">Clear filter</Button>}
            />
            <ErrorState title="Can't load movies" onRetry={() => toast.show({ title: 'Retrying…' })} />
          </div>
        </Section>
      </div>
    </div>
  )
}
