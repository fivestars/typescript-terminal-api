/** @jsx h */;
import { h } from "preact";
import { JsonView, defaultStyles } from 'react-json-view-lite';

interface ObjectJsonViewerProps {
    data: Object | any[]
}

const logStyle = {
    ...defaultStyles,
    container: '#eee0',
}

export default function ObjectJsonViewer(props: ObjectJsonViewerProps) {
    return (
        <JsonView data={props.data} style={logStyle} shouldInitiallyExpand={() => false}/>
    )
}
