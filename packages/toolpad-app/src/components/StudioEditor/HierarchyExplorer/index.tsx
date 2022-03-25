import { TreeView } from '@mui/lab';
import {
  Button,
  Dialog,
  DialogActions,
  DialogTitle,
  Typography,
  styled,
  Box,
  IconButton,
} from '@mui/material';
import * as React from 'react';
import TreeItem, { TreeItemProps } from '@mui/lab/TreeItem';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { NodeId } from '../../../types';
import * as studioDom from '../../../studioDom';
import { useDom, useDomApi } from '../../DomLoader';
import CreateStudioPageDialog from './CreateStudioPageDialog';
import CreateStudioCodeComponentDialog from './CreateStudioCodeComponentDialog';
import CreateStudioApiDialog from './CreateStudioApiDialog';
import CreateStudioConnectionDialog from './CreateStudioConnectionDialog';
import useLocalStorageState from '../../../utils/useLocalStorageState';

const HierarchyExplorerRoot = styled('div')({
  overflow: 'auto',
  width: '100%',
});

type StyledTreeItemProps = TreeItemProps & {
  onDelete?: React.MouseEventHandler;
  onCreate?: React.MouseEventHandler;
  labelIcon?: React.ReactNode;
  labelText: string;
};

function HierarchyTreeItem(props: StyledTreeItemProps) {
  const { labelIcon, labelText, onCreate, onDelete, ...other } = props;

  return (
    <TreeItem
      label={
        <Box sx={{ display: 'flex', alignItems: 'center', p: 0.5, pr: 0 }}>
          {labelIcon}
          <Typography variant="body2" sx={{ fontWeight: 'inherit', flexGrow: 1 }}>
            {labelText}
          </Typography>
          {onCreate ? (
            <IconButton size="small" onClick={onCreate}>
              <AddIcon fontSize="small" />
            </IconButton>
          ) : null}
          {onDelete ? (
            <IconButton size="small" onClick={onDelete}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          ) : null}
        </Box>
      }
      {...other}
    />
  );
}

export interface HierarchyExplorerProps {
  appId: string;
  className?: string;
}

export default function HierarchyExplorer({ appId, className }: HierarchyExplorerProps) {
  const dom = useDom();
  const domApi = useDomApi();

  const app = studioDom.getApp(dom);
  const {
    apis = [],
    codeComponents = [],
    pages = [],
    connections = [],
  } = studioDom.getChildNodes(dom, app);

  const [expanded, setExpanded] = useLocalStorageState<string[]>(
    `editor/${app.id}/hierarchy-expansion`,
    [':connections', ':pages', ':apis', ':codeComponents'],
  );

  const selected: NodeId[] = [];

  const handleToggle = (event: React.SyntheticEvent, nodeIds: string[]) => {
    setExpanded(nodeIds as NodeId[]);
  };

  const navigate = useNavigate();

  const handleSelect = (event: React.SyntheticEvent, nodeIds: string[]) => {
    if (nodeIds.length <= 0) {
      return;
    }

    const rawNodeId = nodeIds[0];
    if (rawNodeId.startsWith(':')) {
      return;
    }

    const studioNodeId: NodeId = rawNodeId as NodeId;
    const node = studioDom.getNode(dom, studioNodeId);
    if (studioDom.isElement(node)) {
      // TODO: sort out in-page selection
      const page = studioDom.getPageAncestor(dom, node);
      if (page) {
        navigate(`/app/${appId}/editor/pages/${page.id}`);
      }
    }

    if (studioDom.isPage(node)) {
      navigate(`/app/${appId}/editor/pages/${node.id}`);
    }

    if (studioDom.isApi(node)) {
      navigate(`/app/${appId}/editor/apis/${node.id}`);
    }

    if (studioDom.isCodeComponent(node)) {
      navigate(`/app/${appId}/editor/codeComponents/${node.id}`);
    }

    if (studioDom.isConnection(node)) {
      navigate(`/app/${appId}/editor/connections/${node.id}`);
    }
  };

  const [createConnectionDialogOpen, setCreateConnectionDialogOpen] = React.useState(0);
  const handleCreateConnectionDialogOpen = React.useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    setCreateConnectionDialogOpen(Math.random());
  }, []);
  const handleCreateConnectionDialogClose = React.useCallback(
    () => setCreateConnectionDialogOpen(0),
    [],
  );

  const [createApiDialogOpen, setCreateApiDialogOpen] = React.useState(0);
  const handleCreateApiDialogOpen = React.useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    setCreateApiDialogOpen(Math.random());
  }, []);
  const handleCreateApiDialogClose = React.useCallback(() => setCreateApiDialogOpen(0), []);

  const [createPageDialogOpen, setCreatePageDialogOpen] = React.useState(0);
  const handleCreatePageDialogOpen = React.useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    setCreatePageDialogOpen(Math.random());
  }, []);
  const handleCreatepageDialogClose = React.useCallback(() => setCreatePageDialogOpen(0), []);

  const [createCodeComponentDialogOpen, setCreateCodeComponentDialogOpen] = React.useState(0);
  const handleCreateCodeComponentDialogOpen = React.useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    setCreateCodeComponentDialogOpen(Math.random());
  }, []);
  const handleCreateCodeComponentDialogClose = React.useCallback(
    () => setCreateCodeComponentDialogOpen(0),
    [],
  );

  const [deletedNodeId, setDeletedNodeId] = React.useState<NodeId | null>(null);
  const handleDeleteNodeDialogOpen = React.useCallback(
    (nodeId: NodeId) => (event: React.MouseEvent) => {
      event.stopPropagation();
      setDeletedNodeId(nodeId);
    },
    [],
  );
  const handledeleteNodeDialogClose = React.useCallback(() => setDeletedNodeId(null), []);

  const handleDeleteNode = React.useCallback(() => {
    if (deletedNodeId) {
      domApi.removeNode(deletedNodeId);
      navigate(`/app/${appId}/editor/`);
      handledeleteNodeDialogClose();
    }
  }, [deletedNodeId, domApi, navigate, appId, handledeleteNodeDialogClose]);

  const deletedNode = deletedNodeId && studioDom.getMaybeNode(dom, deletedNodeId);

  return (
    <HierarchyExplorerRoot className={className}>
      <TreeView
        aria-label="hierarchy explorer"
        selected={selected}
        onNodeSelect={handleSelect}
        expanded={expanded}
        onNodeToggle={handleToggle}
        multiSelect
        defaultCollapseIcon={<ExpandMoreIcon />}
        defaultExpandIcon={<ChevronRightIcon />}
      >
        <HierarchyTreeItem
          nodeId=":connections"
          labelText="Connections"
          onCreate={handleCreateConnectionDialogOpen}
        >
          {connections.map((connectionNode) => (
            <HierarchyTreeItem
              key={connectionNode.id}
              nodeId={connectionNode.id}
              labelText={connectionNode.name}
              onDelete={handleDeleteNodeDialogOpen(connectionNode.id)}
            />
          ))}
        </HierarchyTreeItem>
        <HierarchyTreeItem nodeId=":apis" labelText="Apis" onCreate={handleCreateApiDialogOpen}>
          {apis.map((apiNode) => (
            <HierarchyTreeItem
              key={apiNode.id}
              nodeId={apiNode.id}
              labelText={apiNode.name}
              onDelete={handleDeleteNodeDialogOpen(apiNode.id)}
            />
          ))}
        </HierarchyTreeItem>
        <HierarchyTreeItem
          nodeId=":codeComponents"
          labelText="Components"
          onCreate={handleCreateCodeComponentDialogOpen}
        >
          {codeComponents.map((codeComponent) => (
            <HierarchyTreeItem
              key={codeComponent.id}
              nodeId={codeComponent.id}
              labelText={codeComponent.name}
              onDelete={handleDeleteNodeDialogOpen(codeComponent.id)}
            />
          ))}
        </HierarchyTreeItem>
        <HierarchyTreeItem nodeId=":pages" labelText="Pages" onCreate={handleCreatePageDialogOpen}>
          {pages.map((page) => (
            <HierarchyTreeItem
              key={page.id}
              nodeId={page.id}
              labelText={page.name}
              onDelete={handleDeleteNodeDialogOpen(page.id)}
            />
          ))}
        </HierarchyTreeItem>
      </TreeView>

      <CreateStudioConnectionDialog
        key={createConnectionDialogOpen || undefined}
        appId={appId}
        open={!!createConnectionDialogOpen}
        onClose={handleCreateConnectionDialogClose}
      />
      <CreateStudioApiDialog
        key={createApiDialogOpen || undefined}
        appId={appId}
        open={!!createApiDialogOpen}
        onClose={handleCreateApiDialogClose}
      />
      <CreateStudioPageDialog
        key={createPageDialogOpen || undefined}
        appId={appId}
        open={!!createPageDialogOpen}
        onClose={handleCreatepageDialogClose}
      />
      <CreateStudioCodeComponentDialog
        key={createCodeComponentDialogOpen || undefined}
        appId={appId}
        open={!!createCodeComponentDialogOpen}
        onClose={handleCreateCodeComponentDialogClose}
      />
      <Dialog open={!!deletedNode} onClose={handledeleteNodeDialogClose}>
        <DialogTitle>
          Delete {deletedNode?.type} &quot;{deletedNode?.name}&quot;?
        </DialogTitle>
        <DialogActions>
          <Button type="submit" onClick={handledeleteNodeDialogClose}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleDeleteNode}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </HierarchyExplorerRoot>
  );
}